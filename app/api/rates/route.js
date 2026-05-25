import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test Frankfurter v2 format
    const fxRes = await fetch('https://api.frankfurter.dev/v2/latest?base=USD&symbols=MYR')
    const fxData = await fxRes.json()

    let usdToMyr = null

    // Try v2 format first (rates.MYR)
    if (fxData?.rates?.MYR) {
      usdToMyr = fxData.rates.MYR
    }
    // Fallback: try old frankfurter format
    else if (fxData?.rates?.MYR) {
      usdToMyr = fxData.rates.MYR
    }

    // If v2 failed, try old endpoint
    if (!usdToMyr) {
      const fxRes2 = await fetch('https://api.frankfurter.app/latest?from=USD&to=MYR')
      const fxData2 = await fxRes2.json()
      usdToMyr = fxData2?.rates?.MYR ?? null
    }

    // Previous day for % change
    let fxChange = null
    if (usdToMyr) {
      try {
        const prevRes = await fetch('https://api.frankfurter.app/2026-05-22?from=USD&to=MYR')
        const prevData = await prevRes.json()
        const prevRate = prevData?.rates?.MYR
        if (prevRate) {
          fxChange = ((usdToMyr - prevRate) / prevRate) * 100
        }
      } catch {}
    }

    // Gold price
    let goldUsd = null
    let goldChange = null

    try {
      const goldRes = await fetch('https://gold-api.com/price/XAU', {
        headers: { 'Accept': 'application/json' }
      })
      const goldData = await goldRes.json()
      goldUsd = goldData?.price ?? goldData?.Price ?? null
      goldChange = goldData?.chp ?? goldData?.change_percent ?? null
    } catch {}

    // Fallback gold via frankfurter XAU
    if (!goldUsd) {
      try {
        const xauRes = await fetch('https://api.frankfurter.app/latest?from=XAU&to=USD')
        const xauData = await xauRes.json()
        goldUsd = xauData?.rates?.USD ?? null
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
      _debug: { fxData: JSON.stringify(fxData).slice(0, 200) }
    })

  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack?.slice(0, 300) }, { status: 500 })
  }
}
