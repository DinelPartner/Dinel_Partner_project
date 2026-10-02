import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'dinelpartner-cookie-consent';

const copy = {
    sv: {
        text: "Vi använder Google Maps (för kartan i kontaktsektionen) och Google reCAPTCHA (för spamskydd i våra formulär). Båda tjänsterna kan läsa in innehåll och cookies från Google när du besöker sidan.",
        privacyLabel: "Läs vår integritetspolicy",
        privacyHref: "/sv/integritetspolicy",
        acceptAll: "Acceptera alla",
        necessaryOnly: "Endast nödvändiga",
    },
    en: {
        text: "We use Google Maps (for the map in our contact section) and Google reCAPTCHA (for spam protection on our forms). Both services may load content and cookies from Google when you view the site.",
        privacyLabel: "Read our privacy policy",
        privacyHref: "/en/privacy-policy",
        acceptAll: "Accept all",
        necessaryOnly: "Necessary only",
    },
};

export default function CookieConsent({ lang = 'sv' }) {
    const t = copy[lang] || copy.sv;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (!stored) setVisible(true);
        } catch (e) {
            // localStorage unavailable (private mode, blocked storage, etc.) —
            // fail open by not showing a banner we can't persist the choice for.
        }
    }, []);

    const dismiss = (choice) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, choice);
        } catch (e) {
            // ignore write failures, just hide the banner for this view
        }
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            role="region"
            aria-label={lang === 'en' ? 'Cookie notice' : 'Information om cookies'}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-gray-900 text-white px-5 py-5 md:px-8 shadow-[0_-8px_24px_rgba(0,0,0,.2)]"
        >
            <div className="container mx-auto flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                <p className="text-sm leading-relaxed text-gray-200 flex-1">
                    {t.text}{' '}
                    <a href={t.privacyHref} className="underline text-accent hover:text-accent-hover">
                        {t.privacyLabel}
                    </a>
                </p>
                <div className="flex gap-3 flex-shrink-0 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={() => dismiss('necessary')}
                        className="flex-1 md:flex-none px-4 py-2.5 rounded text-sm font-semibold border border-white/25 text-white hover:bg-white/10 transition-colors"
                    >
                        {t.necessaryOnly}
                    </button>
                    <button
                        type="button"
                        onClick={() => dismiss('all')}
                        className="flex-1 md:flex-none px-5 py-2.5 rounded text-sm font-bold bg-accent hover:bg-accent-hover text-gray-900 transition-colors"
                    >
                        {t.acceptAll}
                    </button>
                </div>
            </div>
        </div>
    );
}
