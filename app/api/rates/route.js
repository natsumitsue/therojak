import { NextResponse } from 'next/server'

export const revalidate = 60 // cache 60 seconds

export async function GET() {
  try {
    // 1. Fetch USD/MYR from Frankfurter
    const [fxRes, fxPrevRes, goldRes] = await Promise.allSettled([
      fetch('https://api.frankfurter.dev/v2/rates?base=USD&quotes=MYR', { next: { revalidate: 60 } }),
      fetch('https://api.frankfurter.dev/v2/rates?base=USD&quotes=MYR&date=prev', { next: { revalidate: 3600 } }),
      fetch('https://gold-api.com/price/XAU', { next: { revalidate: 60 } }),
    ])

    let usdToMyr = null
    let prevUsdToMyr = null
    let goldUsd = null
    let goldChange = null

    // Parse FX
    if (fxRes.status === 'fulfilled' && fxRes.value.ok) {
      const fxData = await fxRes.value.json()
      usdToMyr = fxData.rates?.MYR ?? null
    }

    // Parse previous FX for % change
    if (fxPrevRes.status === 'fulfilled' && fxPrevRes.value.ok) {
      const prevData = await fxPrevRes.value.json()
      prevUsdToMyr = prevData.rates?.MYR ?? null
    }

    const fxChange = (usdToMyr && prevUsdToMyr)
      ? ((usdToMyr - prevUsdToMyr) / prevUsdToMyr) * 100
      : null

    // Parse Gold
    if (goldRes.status === 'fulfilled' && goldRes.value.ok) {
      const goldData = await goldRes.value.json()
      goldUsd = goldData?.price ?? null
      goldChange = goldData?.chp ?? null
    }

    // Fallback gold: use XAU from Frankfurter
    if (!goldUsd) {
      try {
        const xauRes = await fetch('https://api.frankfurter.dev/v2/rates?base=XAU&quotes=USD')
        if (xauRes.ok) {
          const xauData = await xauRes.json()
          goldUsd = xauData.rates?.USD ?? null
        }
      } catch {}
    }

    const TROY_OZ_TO_GRAM = 31.1035
    const goldPerGramUsd = goldUsd ? goldUsd / TROY_OZ_TO_GRAM : null
    const goldPerGramMyr = (goldPerGramUsd && usdToMyr) ? goldPerGramUsd * usdToMyr : null
    const goldPerOzMyr = (goldUsd && usdToMyr) ? goldUsd * usdToMyr : null

    return NextResponse.json({
      usdToMyr,
      myrToUsd: usdToMyr ? 1 / usdToMyr : null,
      fxChange,
      goldUsd,
      goldPerGramUsd,
      goldPerGramMyr,
      goldPerOzMyr,
      goldChange,
      updatedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
