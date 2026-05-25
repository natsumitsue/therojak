import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Currency: frankfurter.app
    const fxRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=MYR')
    const fxData = await fxRes.json()
    const usdToMyr = fxData?.rates?.MYR ?? null

    // Previous day % change
    let fxChange = null
    if (usdToMyr) {
      try {
        const prevRes = await fetch('https://api.frankfurter.app/2026-05-23?from=USD&to=MYR')
        const prevData = await prevRes.json()
        const prevRate = prevData?.rates?.MYR
        if (prevRate) fxChange = ((usdToMyr - prevRate) / prevRate) * 100
      } catch {}
    }

    // Gold Method 1: metals.live
    let goldUsd = null
    let goldChange = null

    try {
      const goldRes = await fetch('https://api.metals.live/v1/spot/gold')
      const goldData = await goldRes.json()
      if (Array.isArray(goldData) && goldData[0]?.gold) {
        goldUsd = goldData[0].gold
      } else if (goldData?.gold) {
        goldUsd = goldData.gold
      }
    } catch {}

    // Gold Method 2: fawazahmed0 CDN (XAU in USD)
    if (!goldUsd) {
      try {
        const xauRes = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json')
        const xauData = await xauRes.json()
        if (xauData?.xau?.usd) goldUsd = xauData.xau.usd
      } catch {}
    }

    // Gold Method 3: frankfurter XAU/USD
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
    })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
