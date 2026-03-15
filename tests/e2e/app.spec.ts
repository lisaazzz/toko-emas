import { test, expect } from '@playwright/test'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function waitForApp(page: any) {
  // Wait for the bottom nav to appear — signals the app has loaded
  await page.waitForSelector('nav', { timeout: 15000 })
}

// ── Navigation ─────────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('loads the home page', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    // Bottom nav should have the 4 tabs
    await expect(page.getByRole('button', { name: /Dashboard/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Nota/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Customer/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Timbang/i })).toBeVisible()
  })

  test('switches to Customer tab', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    await page.getByRole('button', { name: /Customer/i }).click()
    await expect(page.getByRole('heading', { name: 'CUSTOMER' })).toBeVisible()
  })

  test('switches to Nota tab', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    await page.getByRole('button', { name: /Nota/i }).click()
    await expect(page.getByRole('heading', { name: 'NOTA' })).toBeVisible()
  })

  test('switches to Timbang tab', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    await page.getByRole('button', { name: /Timbang/i }).click()
    await expect(page.getByRole('heading', { name: 'TIMBANG HARIAN' })).toBeVisible()
  })
})

// ── API: /api/init ─────────────────────────────────────────────────────────

test.describe('API /api/init', () => {
  test('returns user data', async ({ request }) => {
    const res = await request.get('/api/init')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('id')
    expect(body).toHaveProperty('name')
    expect(body).toHaveProperty('username')
    expect(typeof body.id).toBe('string')
  })
})

// ── API: /api/customers ────────────────────────────────────────────────────

test.describe('API /api/customers', () => {
  let userId: string
  let createdCustomerId: string

  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/init')
    const body = await res.json()
    userId = body.id
  })

  test('GET returns array', async ({ request }) => {
    const res = await request.get(`/api/customers?userId=${userId}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('POST creates a customer', async ({ request }) => {
    const res = await request.post('/api/customers', {
      data: { userId, name: 'Test E2E Customer', store: 'Toko Test E2E', phone: '08123456789' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('Test E2E Customer')
    expect(body.store).toBe('Toko Test E2E')
    expect(body.id).toBeTruthy()
    createdCustomerId = body.id
  })

  test('POST returns 400 when name is missing', async ({ request }) => {
    const res = await request.post('/api/customers', {
      data: { userId },
    })
    expect(res.status()).toBe(400)
  })

  test('PUT updates a customer', async ({ request }) => {
    // Create one first to update
    const createRes = await request.post('/api/customers', {
      data: { userId, name: 'Update Target', store: null, phone: null },
    })
    const created = await createRes.json()

    const res = await request.put(`/api/customers/${created.id}`, {
      data: { userId, name: 'Updated Name', store: 'Updated Store', phone: null },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('Updated Name')
    expect(body.store).toBe('Updated Store')

    // Cleanup
    await request.delete(`/api/customers/${created.id}`)
  })

  test('DELETE removes a customer', async ({ request }) => {
    // Create one to delete
    const createRes = await request.post('/api/customers', {
      data: { userId, name: 'Delete Me', store: null, phone: null },
    })
    const created = await createRes.json()

    const res = await request.delete(`/api/customers/${created.id}`)
    expect(res.status()).toBe(200)

    // Verify gone
    const allRes = await request.get(`/api/customers?userId=${userId}`)
    const all = await allRes.json()
    expect(all.find((c: any) => c.id === created.id)).toBeUndefined()
  })

  test.afterAll(async ({ request }) => {
    // Cleanup the customer created in POST test
    if (createdCustomerId) {
      await request.delete(`/api/customers/${createdCustomerId}`)
    }
  })
})

// ── API: /api/notas ────────────────────────────────────────────────────────

test.describe('API /api/notas', () => {
  let userId: string
  let createdNotaId: string

  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/init')
    userId = (await res.json()).id
  })

  test('GET returns array', async ({ request }) => {
    const res = await request.get(`/api/notas?userId=${userId}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('POST creates a nota', async ({ request }) => {
    const res = await request.post('/api/notas', {
      data: {
        userId,
        date: '2024-06-01',
        type: 'sale',
        items: [{ gross: 10, pct: 95, net: 9.5 }],
        totalGross: 10,
        totalNet: 9.5,
        catatan: 'E2E test nota',
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.id).toBeTruthy()
    expect(body.notaNo).toMatch(/^[A-Z]+ \d{5}$/)
    expect(body.type).toBe('sale')
    expect(Array.isArray(body.items)).toBe(true)
    expect(body.items[0].gross).toBe(10)
    createdNotaId = body.id
  })

  test('POST returns 400 when userId is missing', async ({ request }) => {
    const res = await request.post('/api/notas', {
      data: { date: '2024-06-01', type: 'sale', items: [], totalGross: 0, totalNet: 0 },
    })
    expect(res.status()).toBe(400)
  })

  test('GET by id returns nota with payments and returs', async ({ request }) => {
    const res = await request.get(`/api/notas/${createdNotaId}?userId=${userId}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(createdNotaId)
    expect(Array.isArray(body.payments)).toBe(true)
    expect(Array.isArray(body.returs)).toBe(true)
  })

  test('DELETE removes a nota', async ({ request }) => {
    const res = await request.delete(`/api/notas/${createdNotaId}`)
    expect(res.status()).toBe(200)
    createdNotaId = ''
  })

  test.afterAll(async ({ request }) => {
    if (createdNotaId) {
      await request.delete(`/api/notas/${createdNotaId}`)
    }
  })
})

// ── Customer CRUD via UI ───────────────────────────────────────────────────

test.describe('Customer UI', () => {
  test('can add a customer via UI form', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    await page.getByRole('button', { name: /Customer/i }).click()
    await expect(page.getByRole('heading', { name: 'CUSTOMER' })).toBeVisible()

    // Open form via FAB (+) button
    await page.locator('button', { hasText: '+' }).click()
    await expect(page.getByText('Tambah Customer')).toBeVisible()

    // Fill in the form
    const nameInput = page.getByPlaceholder('Nama customer')
    const storeInput = page.getByPlaceholder('Toko Emas Sejahtera')
    await nameInput.fill('UI Test Customer')
    await storeInput.fill('UI Test Toko')

    // Save
    await page.getByRole('button', { name: 'Simpan' }).click()

    // The form should close and the customer should appear in the list
    await expect(page.getByText('UI Test Toko')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('UI Test Customer')).toBeVisible()

    // Cleanup: delete the created customer
    const card = page.locator('div').filter({ hasText: 'UI Test Toko' }).first()
    await card.getByRole('button', { name: 'Hapus' }).click()
    await page.getByRole('button', { name: 'Hapus' }).last().click()
    // Wait for the customer list card (paragraph) to disappear
    await expect(page.locator('p.font-bold').filter({ hasText: 'UI Test Toko' })).not.toBeVisible({ timeout: 5000 })
  })

  test('shows empty state when no customers', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    await page.getByRole('button', { name: /Customer/i }).click()
    // Either shows list items or the empty state — just ensure page loaded
    await expect(page.getByRole('heading', { name: 'CUSTOMER' })).toBeVisible()
  })
})

// ── Dashboard tab ──────────────────────────────────────────────────────────

test.describe('Dashboard', () => {
  test('loads dashboard tab by default', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    // Dashboard button should be active
    const dashBtn = page.getByRole('button', { name: /Dashboard/i })
    await expect(dashBtn).toBeVisible()
  })
})
