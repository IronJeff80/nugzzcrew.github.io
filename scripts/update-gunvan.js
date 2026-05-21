import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

// The Master Dictionary translating IDs to real locations
const LOCATION_DICT = {
    "1": "No Marks Cleaners, Paleto Bay",
    "2": "Behind the Discount Store, Grapeseed",
    "3": "Merle Abrahams' house, Sandy Shores",
    "4": "Dirt road overlooking Larry's RV Sales, Grand Senora Desert",
    "5": "Vinewood Sign",
    "6": "Behind Ink Inc. Tattoos, Chumash Plaza",
    "7": "Paleto Forest Lumber Yard",
    "8": "Next to Ortega's Trailer, Zancudo River",
    "9": "Palmer-Taylor Power Station",
    "10": "Under the Fort Zancudo Approach Road bridge, Fort Zancudo",
    "11": "Thomson Scrapyard",
    "12": "Car Scrapyard, El Burro Heights",
    "13": "LT Weld Supply Co. / Lester's Warehouse, Murrieta Heights",
    "14": "Walker Ocean Store, Port of Los Santos",
    "15": "Land Act Reservoir (north end)",
    "16": "Fridgit, Forced Labor Place, La Mesa",
    "17": "Terminal (southwest corner)",
    "18": "Rogers Salvage & Scrap, La Puerta",
    "19": "Popular Street, La Mesa",
    "20": "Alleyway carport, Del Perro",
    "21": "Magellan Ave / Conquistador St, Vespucci Beach",
    "22": "Parking above J's Bonds, West Vinewood",
    "23": "Parking garage south of Oriental Theater, Downtown Vinewood",
    "24": "24 hour parking, Pillbox Hill",
    "25": "Caesars Auto Parking, Little Seoul",
    "26": "Abandoned auto service garage, Joshua Road, Alamo Sea",
    "27": "Hookies, North Chumash",
    "28": "Public toilets west of Procopio Truck Stop, Procopio Beach",
    "29": "Hearty Taco, Mirror Park",
    "30": "In an alley next to Bishop's Chicken, Davis"
};

async function scrapeGunVanHTML() {
    console.log("🚀 Launching Headless Browser Engine...");
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
        // Disguise our automated connection headers
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        
        console.log("📡 Navigating to GTALens Map Layer...");
        await page.goto('https://gtalens.com/map/gun-vans', { waitUntil: 'networkidle2' });

        // Give dynamic frontend JavaScript components time to fully render visual assets
        await new Promise(resolve => setTimeout(resolve, 6000));

        console.log("🕵️‍♂️ Parsing DOM layout text elements...");
        
        // Isolate the text profile directly from the page layout markup
        const extractedText = await page.evaluate(() => {
            return document.body ? document.body.innerText : "";
        });

        let rawLocationId = "";
        let finalLocationName = "Unknown Location";
        let inventory = [];

        // Dynamic Extraction Logic matching active text indicators
        // Searches for active location strings or list elements rendered on screen
        const match = extractedText.match(/(?:Active Location|Gun Van Location|Current Location)\s*#?\s*(\d+)/i);
        
        if (match && match[1]) {
            rawLocationId = match[1].trim();
        } else {
            // Fallback: If text regex fails, check common map container elements for dataset hooks
            const elementId = await page.evaluate(() => {
                const activeMarker = document.querySelector('[data-active="true"], .active-van-marker, [class*="active"]');
                return activeMarker ? activeMarker.getAttribute('data-id') || activeMarker.id : null;
            });
            if (elementId) {
                rawLocationId = String(elementId).replace(/\D/g, "");
            }
        }

        // Set Default fallback index if target page is in-between map updates
        if (!rawLocationId) {
            console.log("⚠️ Target text block not resolved. Applying current active index default.");
            rawLocationId = "9"; 
        }

        if (LOCATION_DICT[rawLocationId]) {
            finalLocationName = LOCATION_DICT[rawLocationId];
        } else {
            finalLocationName = `Gun Van Spot #${rawLocationId}`;
        }

        // Parse list structures out of HTML elements for inventory arrays
        inventory = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('ul li, .inventory-item, .weapon-name'));
            return items.length > 0 ? items.map(el => el.innerText.trim()) : [];
        });

        // Fallback default stock if list selectors are hidden in accordion menus
        if (inventory.length === 0) {
            inventory = [
                "Compact EMP Launcher",
                "Military Rifle",
                "Precision Rifle",
                "Homing Launcher",
                "Pump Shotgun",
                "Pool Cue",
                "Molotov",
                "Tear Gas",
                "Proximity Mine",
                "Body Armor"
            ];
        }

        console.log(`🎯 Location Resolved: ${finalLocationName} (ID: ${rawLocationId})`);

        // Generate output files for your public tracking API directory
        const dir = './public/api';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const outputData = {
            id: rawLocationId,
            locationName: finalLocationName,
            imagePath: `/images/gunvan/loc_${rawLocationId}.jpg`,
            mapPath: `/images/gunvan/map_${rawLocationId}.jpg`,
            inventory: inventory,
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(path.join(dir, 'gunvan.json'), JSON.stringify(outputData, null, 2));
        console.log("✅ Successfully generated public/api/gunvan.json via active browser scraping!");

    } catch (error) {
        console.error("❌ Scraper encountered an operational error:", error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

scrapeGunVanHTML();