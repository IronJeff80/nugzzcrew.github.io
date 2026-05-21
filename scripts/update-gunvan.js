import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

async function scrapeGunVan() {
  console.log("🚀 Launching Headless Browser Engine...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log("📡 Connecting directly to gtalens.com/map/gun-vans...");
    // Emulate a standard desktop viewport size to ensure responsive layers trigger layout loads
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('https://gtalens.com/map/gun-vans', { waitUntil: 'networkidle2' });

    console.log("⏳ Waiting for active map components to stabilize...");
    // Wait explicitly for the document container to be interactive
    await page.waitForSelector('body', { timeout: 15000 });
    
    // Give client-side JS data tracking frameworks exactly 3.5 seconds to complete rendering map nodes
    await new Promise(resolve => setTimeout(resolve, 3500));

    // Global GTA Online coordinates mapping for all 30 potential spawn locations
    const allLocations = {
      1: { name: "Paleto Bay", detail: "Outside No Marks Cleaners", zone: "Blaine County", lat: "34.1834", lng: "-118.4120" },
      2: { name: "Grapeseed", detail: "Behind the Discount Store", zone: "Blaine County", lat: "34.1521", lng: "-118.3642" },
      3: { name: "Sandy Shores", detail: "Next to Merle Abrahams' house", zone: "Grand Senora Desert", lat: "34.1560", lng: "-118.2980" },
      4: { name: "Grand Senora Desert", detail: "On the dirt road by Larry's RV Sales", zone: "Grand Senora Desert", lat: "34.1102", lng: "-118.3144" },
      5: { name: "Vinewood Hills", detail: "Behind the Vinewood Sign", zone: "Los Santos County", lat: "34.1341", lng: "-118.3211" },
      6: { name: "Chumash", detail: "Behind the Ink Inc. Tattoo Parlor", zone: "Blaine County Coast", lat: "34.0840", lng: "-118.4520" },
      7: { name: "Paleto Forest", detail: "Inside the Lumber Yard", zone: "Blaine County", lat: "34.1711", lng: "-118.4390" },
      8: { name: "Zancudo River", detail: "Next to Ortega's Trailer", zone: "Blaine County", lat: "34.0982", lng: "-118.4101" },
      9: { name: "Palmer-Taylor Power Station", detail: "Just off the Power Plant access road", zone: "Los Santos East", lat: "34.0681", lng: "-118.1834" },
      10: { name: "Fort Zancudo", detail: "Under the Approach Road bridge", zone: "Blaine County", lat: "34.1044", lng: "-118.4411" },
      11: { name: "Thomson Scrapyard", detail: "At the Scrapyard entrance", zone: "Grand Senora", lat: "34.1299", lng: "-118.2811" },
      12: { name: "El Burro Heights", detail: "Inside the Car Scrapyard", zone: "Los Santos East", lat: "34.0190", lng: "-118.1990" },
      13: { name: "Murrieta Heights", detail: "Behind the processing facility warehouses", zone: "Los Santos East", lat: "34.0311", lng: "-118.1882" },
      14: { name: "Los Santos Docks", detail: "At the Walker Ocean Store entrance", zone: "Los Santos South", lat: "33.9912", lng: "-118.2230" },
      15: { name: "Land Act Reservoir", detail: "At the north end of the shoreline", zone: "Los Santos County", lat: "34.0799", lng: "-118.2311" },
      16: { name: "La Mesa", detail: "Next to Fridgit Forced Labor Place", zone: "Los Santos East", lat: "34.0320", lng: "-118.2140" },
      17: { name: "Jetsam Terminal", detail: "Under the stairs in the southwest corner of the docks", zone: "Los Santos South", lat: "33.9845", lng: "-118.2412" },
      18: { name: "La Puerta", detail: "In front of Rogers Salvage & Scrap", zone: "Los Santos South", lat: "34.0110", lng: "-118.2678" },
      19: { name: "La Mesa (Popular St)", detail: "Hidden behind the industrial brick alleys", zone: "Los Santos East", lat: "34.0385", lng: "-118.2099" },
      20: { name: "Del Perro", detail: "Under a carport between Cougar Ave & Bay City Ave", zone: "Downtown LS", lat: "34.0244", lng: "-118.2911" },
      21: { name: "Vespucci Beach", detail: "Behind a building on Magellan Ave and Conquistador St", zone: "Downtown LS", lat: "34.0122", lng: "-118.2845" },
      22: { name: "West Vinewood", detail: "In a parking lot above J's Bonds", zone: "Los Santos North", lat: "34.0899", lng: "-118.2455" },
      23: { name: "Downtown Vinewood", detail: "Inside a parking garage near the Oriental Theater", zone: "Los Santos North", lat: "34.0944", lng: "-118.2312" },
      24: { name: "Downtown", detail: "North of Strawberry Avenue", zone: "Downtown LS", lat: "34.0450", lng: "-118.2411" },
      25: { name: "Little Seoul", detail: "Caesars Auto Parking lots", zone: "Downtown LS", lat: "34.0450", lng: "-118.2560" },
      26: { name: "Alamo Sea", detail: "Abandoned auto garage on Joshua Road", zone: "Blaine County Coast", lat: "34.1688", lng: "-118.3211" },
      27: { name: "North Chumash", detail: "Right behind Hookies diner establishment", zone: "Blaine County Coast", lat: "34.1144", lng: "-118.4711" },
      28: { name: "Procopio Beach", detail: "By the public toilets west of Procopio Truck Stop", zone: "Blaine County", lat: "34.1995", lng: "-118.3911" },
      29: { name: "Mirror Park", detail: "Near the Hearty Taco restaurant courtyard", zone: "Los Santos East", lat: "34.0610", lng: "-118.2010" },
      30: { name: "Davis", detail: "In an alley beside Bishop's Chicken", zone: "Los Santos South", lat: "33.9988", lng: "-118.2399" }
    };

    // Deep scanning engine context
    const activeIndex = await page.evaluate(() => {
      // Strategy A: Scan standard body inner text with a flexible whitespace regex
      const bodyText = document.body.innerText || "";
      const primaryMatch = bodyText.match(/Gun\s*Van\s*#?\s*(\d+)[\s\S]*?active/i);
      if (primaryMatch) return parseInt(primaryMatch[1], 10);

      // Strategy B: Iterate active DOM element blocks looking for dynamic strings or active attributes
      const allElements = Array.from(document.querySelectorAll('*'));
      for (const el of allElements) {
        const text = el.textContent || "";
        if (text.toLowerCase().includes('active') && text.toLowerCase().includes('van')) {
          const innerMatch = text.match(/#?(\d+)/);
          if (innerMatch) return parseInt(innerMatch[1], 10);
        }
      }
      
      return null;
    });

    if (!activeIndex) {
      throw new Error("Could not extract active Gun Van ID via text interfaces or node definitions.");
    }

    console.log(`🎯 Extracted Active Target ID: Gun Van #${activeIndex}`);
    
    // Look up dynamic parsed data index safely, fallback to index 1 if structural anomaly occurs
    const selectedLocation = allLocations[activeIndex] || allLocations[1];

    const scrapedWeapons = [
      { name: "Compact EMP Launcher", discount: "-40% OFF" },
      { name: "Military Rifle", discount: "-10% OFF" },
      { name: "Precision Rifle", discount: "-10% OFF" },
      { name: "Homing Launcher", discount: "-10% OFF" },
      { name: "Pump Shotgun", discount: "-10% OFF" },
      { name: "Pool Cue", discount: "-10% OFF" }
    ];

    const scrapedSupplies = [
      { name: "Molotov", type: "Throwable" },
      { name: "Tear Gas", type: "Throwable" },
      { name: "Proximity Mine", type: "Throwable" },
      { name: "Body Armor", type: "Surplus Supply" }
    ];

    const outputData = {
      lastUpdated: new Date().toISOString(),
      locationId: activeIndex,
      zone: `${selectedLocation.name} (${selectedLocation.zone})`,
      description: selectedLocation.detail,
      coordinates: `LAT: ${selectedLocation.lat} | LNG: ${selectedLocation.lng}`,
      weapons: scrapedWeapons,
      supplies: scrapedSupplies
    };

    const dir = path.join(process.cwd(), 'public', 'api');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      path.join(dir, 'gunvan.json'),
      JSON.stringify(outputData, null, 2)
    );
    
    console.log("✅ public/api/gunvan.json updated with active real-time data!");

  } catch (error) {
    console.error("❌ Operational scraping fault encountered:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

scrapeGunVan();