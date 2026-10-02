import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare } from 'lucide-react';

export default function StickyCTA({ lang = 'sv' }) {
    const [isVisible, setIsVisible] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const offertHref = lang === 'sv' ? '/valj-offert' : '/en/choose-quote';
    const tooltipText = lang === 'sv' ? '👋 Kontakta oss' : '👋 Contact us';
    const ctaLabel = lang === 'sv' ? 'Begär offert' : 'Request a quote';
    const callLabel = lang === 'sv' ? 'Ring oss' : 'Call us';

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling down 100px (Earlier)
            if (window.scrollY > 100) {
                setIsVisible(true);
                // Show tooltip briefly when it first appears
                if (!isVisible) {
                    setShowTooltip(true);
                    setTimeout(() => setShowTooltip(false), 5000);
                }
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isVisible]);

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex flex-col gap-4 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
        >
            {/* Tooltip Bubble */}
            <div className={`absolute -top-12 right-0 bg-white text-gray-900 px-4 py-2 rounded-lg shadow-xl text-sm font-bold whitespace-nowrap transition-opacity duration-300 ${showTooltip ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
                {tooltipText}
                <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-white transform rotate-45"></div>
            </div>
            {/* Quote/Contact Button */}
            <a
                href={offertHref}
                aria-label={ctaLabel}
                className="flex items-center gap-3 bg-accent hover:bg-accent-hover text-gray-900 px-6 py-3 rounded-full shadow-lg transition-all hover:scale-105 group"
            >
                <span className="font-bold hidden md:block">{ctaLabel}</span>
                <MessageSquare className="w-5 h-5 fill-current" />
            </a>

            {/* Phone Button (Mobile mostly, but good for desktop too) */}
            <a
                href="tel:+46700235436"
                className="flex items-center justify-center bg-gray-900 hover:bg-black text-white w-12 h-12 md:w-auto md:h-auto md:px-6 md:py-3 rounded-full shadow-lg transition-all hover:scale-105 border border-white/10"
                aria-label={callLabel}
            >
                <Phone className="w-5 h-5 md:mr-2" />
                <span className="font-bold hidden md:block">070-023 54 36</span>
            </a>
        </div>
    );
}
