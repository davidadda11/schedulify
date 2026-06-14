import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    // Dacă utilizatorul e autentificat, merge la dashboard
    if (locals.session) {
        throw redirect(302, '/app/dashboard');
    }
    // Altfel, merge la login
    throw redirect(302, '/login');
};