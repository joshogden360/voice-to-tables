import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConvexHttpClient } from "convex/browser";
import dotenv from 'dotenv';

// Load .env.local
// Load .env.local and .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("Missing VITE_CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);
const CSV_DIR = path.join(process.cwd(), 'christmas_card_circuit_csvs');

// Helper to parse CSV simply (handling quoted commas roughly or just valid CSVs)
// Since we don't want to install extra deps if not needed, we'll try a simple regex split or just use 'csv-parse' if available?
// `package.json` doesn't have csv parser. I'll write a simple parser or just splitting by line then regex for columns.
// The CSVs might have commas in values (e.g. "Mom, Dad").
// I will try to use a simple regex for CSV parsing.

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV split that respects quotes
    const row = [];
    let current = '';
    let inQuote = false;
    for (let char of lines[i]) {
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());

    if (row.length < headers.length) continue; // Skip malformed
    
    const obj = {};
    headers.forEach((h, index) => {
      let val = row[index];
      // Clean quotes
      if (val && val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      obj[h] = val;
    });
    data.push(obj);
  }
  return data;
}

// Mappings
const CONTACTS_MAP = {
  "Household Name": "householdName",
  "Individual Names": "individualNames",
  "Relationship": "relationship",
  "Relationship Tier": "relationshipTier",
  "Address Line 1": "addressLine1",
  "Address Line 2": "addressLine2",
  "City": "city",
  "State": "state",
  "ZIP": "zip",
  "Country": "country",
  "Address Status": "addressStatus",
  "Primary Phone": "primaryPhone",
  "Secondary Phone": "secondaryPhone",
  "Primary Email": "primaryEmail",
  "Secondary Email": "secondaryEmail",
  "Instagram": "instagram",
  "Facebook": "facebook",
  "LinkedIn": "linkedIn",
  "Twitter/X": "twitter",
  "Other Social": "otherSocial",
  "Preferred Contact": "preferredContact",
  "Year Added": "yearAdded",
  "Card Type Pref": "cardTypePref",
  "2024 Sent": "sent2024",
  "2024 Response": "response2024",
  "Gift Exchange?": "giftExchange",
  "Gift Occasion": "giftOccasion",
  "Gift Budget Tier": "giftBudgetTier",
  "2024 Gift Given": "giftGiven2024",
  "2024 Gift Value": "giftValue2024",
  "2024 Gift Received": "giftReceived2024",
  "2024 Gift Recv Value": "giftRecvValue2024",
  "Gift Notes": "giftNotes",
  "Birthdays": "birthdays",
  "Anniversary": "anniversary",
  "Kids/Pets": "kidsPets",
  "Notes": "notes",
  "Last Contact Date": "lastContactDate",
  "Annual Touchpoints Target": "annualTouchpointsTarget",
  "2024 Touchpoints": "touchpoints2024",
  "Reciprocity": "reciprocity",
  "Relationship Trend": "relationshipTrend"
};

const INVENTORY_MAP = {
  "Item": "item",
  "Category": "category",
  "Qty On Hand": "qtyOnHand",
  "Reorder Point": "reorderPoint",
  "Unit Cost": "unitCost",
  "Total Value": "totalValue",
  "Supplier": "supplier",
  "Last Ordered": "lastOrdered",
  "Notes": "notes"
};

const SPENDING_MAP = {
  "Year": "year",
  "Cards Sent": "cardsSent",
  "Card Cost": "cardCost",
  "Gifts Given": "giftsGiven",
  "Gift Spend": "giftSpend",
  "Gifts Received": "giftsReceived",
  "Est Value Received": "estValueReceived",
  "Net Flow": "netFlow",
  "Total Spend": "totalSpend",
  "Notes": "notes"
};

async function seed() {
  const userId = "seed_user_id"; // Fixed ID for now or grab from somewhere? We'll use a placeholder.

  // Contacts
  try {
    // USING MOCK DATA: Switched from 'contacts.csv' to 'mock_contacts.csv' to protect PII.
    const content = fs.readFileSync(path.join(CSV_DIR, 'mock_contacts.csv'), 'utf-8');
    const rawData = parseCSV(content);
    const contactsData = rawData.map(r => {
      const mapped = { userId };
      for (const [csvKey, schemaKey] of Object.entries(CONTACTS_MAP)) {
         let val = r[csvKey];
         if (schemaKey.includes('Value') || schemaKey.includes('Cost') || schemaKey.includes('Target') || schemaKey.includes('touchpoints') || schemaKey === 'year') {
            if (val && !isNaN(parseFloat(val))) {
              mapped[schemaKey] = parseFloat(val);
            }
         } else {
            mapped[schemaKey] = val || undefined;
         }
      }
      return mapped;
    });
    console.log(`Importing ${contactsData.length} contacts...`);
    await client.mutation("seed:populateContacts", { data: contactsData });
  } catch (e) {
    console.error("Error seeding contacts:", e);
  }

  // Inventory
  try {
    const content = fs.readFileSync(path.join(CSV_DIR, 'inventory.csv'), 'utf-8');
    const rawData = parseCSV(content);
    const invData = rawData.map(r => {
      const mapped = { userId };
      for (const [csvKey, schemaKey] of Object.entries(INVENTORY_MAP)) {
         let val = r[csvKey];
         if (['qtyOnHand', 'reorderPoint', 'unitCost', 'totalValue'].includes(schemaKey)) {
             if (val && !isNaN(parseFloat(val))) mapped[schemaKey] = parseFloat(val);
         } else {
            mapped[schemaKey] = val || undefined;
         }
      }
      // Safety check: Item is required
      if (mapped.item) return mapped;
    }).filter(x => x);
    console.log(`Importing ${invData.length} inventory items...`);
    await client.mutation("seed:populateInventory", { data: invData });
  } catch (e) {
    console.error("Error seeding inventory:", e);
  }

  // Spending
  try {
    const content = fs.readFileSync(path.join(CSV_DIR, 'spending_history.csv'), 'utf-8');
    const rawData = parseCSV(content);
    const spendData = rawData.map(r => {
       const mapped = { userId };
       for (const [csvKey, schemaKey] of Object.entries(SPENDING_MAP)) {
          let val = r[csvKey];
          if (schemaKey !== 'notes') {
             if (val && !isNaN(parseFloat(val))) mapped[schemaKey] = parseFloat(val);
          } else {
             mapped[schemaKey] = val || undefined;
          }
       }
       // Year is required and number
       if (mapped.year) return mapped;
    }).filter(x => x);
    console.log(`Importing ${spendData.length} spending history records...`);
    await client.mutation("seed:populateSpendingHistory", { data: spendData });
  } catch (e) {
     console.error("Error seeding spending:", e);
  }

  console.log("Seeding complete!");
}

seed();
