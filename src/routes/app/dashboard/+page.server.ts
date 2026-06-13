// src/routes/app/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
// import { db } from '$lib/server/db'; // Importă conexiunea ta la DB

export const load: PageServerLoad = async () => {
    // 1. Aici aduci datele brute din baza ta de date
    // const programDinDB = await db.orar.findMany();
    // const evenimenteDinDB = await db.calendar.findMany();

    // 2. IMPORTANT: Trebuie să le formatezi ca obiecte indexate după cheia zilei "AN-LUNĂ-ZI"
    // pentru ca mini-calendarul din dashboard să le găsească instant.
    
    return {
        // Formatul returnat trebuie să arate cam așa:
        orare: {
            // "2026-6-13": ["Matematică", "Fizică", "Pauză Mare"]
        },
        evenimente: {
            // "2026-6-13": [
            //    { type: 'tema', title: 'Eseu la Română' },
            //    { type: 'test', title: 'Test Istorie' }
            // ]
        }
    };
};