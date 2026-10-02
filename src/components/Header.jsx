import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Globe } from 'lucide-react';

const navItems = {
    sv: [
        { label: 'Om oss', href: '/sv/#om-oss' },
        { label: 'Tjänster', href: '/sv/#tjanster' },
        { label: 'Referensjobb', href: '/sv/#referenser' },
        { label: 'Aktuellt', href: '/sv/aktuellt/' },
        { label: 'Process', href: '/sv/#process' },
        { label: 'Kontakt', href: '/sv/#kontakt' },
    ],
    en: [
        { label: 'About', href: '/en/#om-oss' },
        { label: 'Services', href: '/en/#tjanster' },
        { label: 'References', href: '/en/#referenser' },
        { label: 'News', href: '/en/aktuellt/' },
        { label: 'Process', href: '/en/#process' },
        { label: 'Contact', href: '/en/#kontakt' },
    ]
};

export default function Header({ lang, simpleMode = false }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const items = navItems[lang];
    const offertHref = lang === 'sv' ? '/valj-offert' : '/en/choose-quote';
    const ctaLabel = lang === 'sv' ? 'Begär offert' : 'Request a quote';
    const menuOpenLabel = lang === 'sv' ? 'Öppna meny' : 'Open menu';
    const menuCloseLabel = lang === 'sv' ? 'Stäng meny' : 'Close menu';

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleLanguage = () => {
        const path = window.location.pathname;

        // Specific Offert page handling
        if (path === '/begar-offert-el-installation' || path === '/begar-offert-el-installation/') {
            window.location.href = '/en/quote';
            return;
        }
        if (path === '/en/quote' || path === '/en/quote/') {
            window.location.href = '/begar-offert-el-installation';
            return;
        }
        if (path === '/begar-offert-luft-luft-varmepump' || path === '/begar-offert-luft-luft-varmepump/') {
            window.location.href = '/en/ac-quote';
            return;
        }
        if (path === '/en/ac-quote' || path === '/en/ac-quote/') {
            window.location.href = '/begar-offert-luft-luft-varmepump';
            return;
        }
        if (path === '/valj-offert' || path === '/valj-offert/') {
            window.location.href = '/en/choose-quote';
            return;
        }
        if (path === '/en/choose-quote' || path === '/en/choose-quote/') {
            window.location.href = '/valj-offert';
            return;
        }

        // Default routing for other pages
        if (path.includes('/sv/')) {
            window.location.href = path.replace('/sv/', '/en/');
        } else if (path.includes('/en/')) {
            window.location.href = path.replace('/en/', '/sv/');
        } else {
            // Fallback for root or other pages not strictly following /sv/ /en/ pattern yet
            const newLang = lang === 'sv' ? 'en' : 'sv';
            window.location.href = `/${newLang}/`;
        }
    };

    return (
        <header
            className={`site-header fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'is-scrolled' : ''}`}
        >
            <div className="container mx-auto px-5 md:px-8 flex justify-between items-center">
                {/* Logo */}
                <a href={`/${lang}/`} className="flex items-center gap-3 group">
                    <img src="/logo.png" alt="Din Elpartner Logo" className="h-11 w-11 object-contain" />
                    <span className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-accent transition-colors leading-tight">
                        DIN<span className="text-accent">ELPARTNER</span><small className="block text-[9px] tracking-[0.22em] text-gray-500 font-semibold">SVERIGE AB</small>
                    </span>
                </a>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-7">
                    {!simpleMode && items.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="nav-link text-sm font-medium text-gray-600 hover:text-accent transition-colors uppercase tracking-wider"
                        >
                            {item.label}
                        </a>
                    ))}

                    {!simpleMode && <div className="h-4 w-px bg-gray-200 mx-1" />}

                    <button onClick={toggleLanguage} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-accent transition-colors">
                        <Globe className="w-4 h-4" />
                        {lang === 'sv' ? 'EN' : 'SV'}
                    </button>

                    <a
                        href="tel:+46700235436"
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-accent transition-colors"
                    >
                        <Phone className="w-4 h-4" />
                        <span>070-023 54 36</span>
                    </a>

                    <a
                        href={offertHref}
                        className="button button-primary button-sm"
                    >
                        {ctaLabel}
                    </a>
                </nav>

                {/* Mobile Toggle */}
                {!simpleMode && (
                    <button
                        className="md:hidden text-light"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? menuCloseLabel : menuOpenLabel}
                        aria-expanded={isMobileMenuOpen}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                )}
            </div>

            {/* Mobile Menu */}
            {!simpleMode && isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-6 flex flex-col gap-4 shadow-xl">
                    {items.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="text-lg font-medium text-light hover:text-accent"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {item.label}
                        </a>
                    ))}
                    <div className="h-px bg-gray-100 my-2" />
                    <a href="tel:+46700235436" className="flex items-center gap-2 text-light font-medium">
                        <Phone className="w-4 h-4" />
                        070-023 54 36
                    </a>
                    <a href={offertHref} className="button button-primary justify-center" onClick={() => setIsMobileMenuOpen(false)}>
                        {ctaLabel}
                    </a>
                    <button onClick={toggleLanguage} className="flex items-center gap-2 text-muted">
                        <Globe className="w-4 h-4" />
                        {lang === 'sv' ? 'Switch to English' : 'Byt till Svenska'}
                    </button>
                </div>
            )}
        </header>
    );
}
