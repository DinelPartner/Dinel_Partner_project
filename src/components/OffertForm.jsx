import React, { useState } from 'react';
import { ChevronRight, Check, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const translations = {
    sv: {
        successTitle: "Tack! Vi återkommer snart.",
        successMessage: "Vi har mottagit din förfrågan och återkommer med en offert inom kort.",
        backToHome: "Tillbaka till startsidan",
        title: (
            <>
                Fyll i formuläret så kontaktar vi dig inom 24 timmar för en kostnadsfri offert.
                <br />
                <span className="font-bold">Vid akuta ärenden – ring oss direkt på +46 70 023 54 36.</span>
            </>
        ),
        isHomeowner: "Är du bostadsägare?",
        yes: "Ja",
        no: "Nej",
        location: "Ort / stadsdel",
        locationPlaceholder: "t.ex. Solna",
        name: "Namn",
        namePlaceholder: "Ditt för- och efternamn",
        phone: "Telefon",
        phonePlaceholder: "070 123 45 67",
        email: "E-post",
        emailPlaceholder: "namn@exempel.se",
        message: "Meddelande / Kort beskrivning",
        messagePlaceholder: "Beskriv vad du behöver hjälp med...",
        consent: "Jag godkänner att mina uppgifter sparas för offerthantering.",
        back: "Tillbaka",
        next: "Nästa",
        submit: "Få offert",
        sending: "Skickar...",
        error: "Ett fel uppstod vid skickandet. Kontrollera uppgifterna och försök igen.",
        disclaimer: "Observera: Din förfrågan är inte bindande.",
        // Validation messages
        isHomeownerError: "Välj ett alternativ",
        locationError: "Fyll i ort eller stadsdel",
        nameError: "Fyll i ditt namn",
        phoneEmailError: "Ange telefon eller e-post",
        emailInvalidError: "Ogiltig e-postadress",
        consentError: "Du måste godkänna villkoren",
    },
    en: {
        successTitle: "Thank you! We will get back to you soon.",
        successMessage: "We have received your request and will get back to you with a quote shortly.",
        backToHome: "Back to homepage",
        title: "Fill in the form and we will contact you with a quick and safe quote for your electrical installations.",
        isHomeowner: "Are you a homeowner?",
        yes: "Yes",
        no: "No",
        location: "City / District",
        locationPlaceholder: "e.g. Solna",
        name: "Name",
        namePlaceholder: "Your first and last name",
        phone: "Phone",
        phonePlaceholder: "070 123 45 67",
        email: "Email",
        emailPlaceholder: "name@example.com",
        message: "Message / Short description",
        messagePlaceholder: "Describe what you need help with...",
        consent: "I agree that my details are saved for quote handling.",
        back: "Back",
        next: "Next",
        submit: "Get Quote",
        sending: "Sending...",
        error: "An error occurred while sending. Please check the details and try again.",
        disclaimer: "Note: Your request is not binding.",
        // Validation messages
        isHomeownerError: "Please select an option",
        locationError: "Please enter a city or district",
        nameError: "Please enter your name",
        phoneEmailError: "Please provide phone or email",
        emailInvalidError: "Invalid email address",
        consentError: "You must agree to the terms",
    }
};

const serviceCopy = {
    sv: {
        electrical: {
            heading: 'Begär offert',
            title: (
                <>
                    Fyll i formuläret så kontaktar vi dig inom 24 timmar för en kostnadsfri offert.
                    <br />
                    <span className="font-bold">Vid akuta ärenden – ring oss direkt på +46 70 023 54 36.</span>
                </>
            ),
        },
        ac: {
            heading: 'Få en kostnadsfri offert på luftvärmepump',
            title: (
                <>
                    Sänk dina uppvärmningskostnader och njut av behaglig kyla på sommaren. Med en energieffektiv luft-luftvärmepump får du ett perfekt inomhusklimat året om. Fyll i formuläret nedan för en kostnadsfri offert – vi kontaktar dig inom 24 timmar.
                    <br />
                    <span className="font-bold">Behöver du snabb hjälp? Ring eller SMS:a oss på 0700 235 436.</span>
                </>
            ),
            message: 'Har du några önskemål eller frågor?',
            messagePlaceholder: 'Skriv dem här (valfritt).',
        },
    },
    en: {
        electrical: {
            heading: 'Request Quote',
            title: 'Fill in the form and we will contact you with a quick and safe quote for your electrical installations.',
        },
        ac: {
            heading: 'AC Quote Request',
            title: 'Fill in the form and we will contact you with a quick and safe quote for installation, service or repair of your air conditioning system.',
            message: 'Any wishes or questions?',
            messagePlaceholder: 'Write them here (optional).',
        },
    },
};

export default function OffertForm({ lang = 'sv', service = 'electrical', endpoint = '/api/offert' }) {
    const t = translations[lang] || translations.sv;
    const copy = (serviceCopy[lang] || serviceCopy.sv)[service] || (serviceCopy[lang] || serviceCopy.sv).electrical;
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        isHomeowner: '',
        location: '',
        name: '',
        phone: '',
        email: '',
        message: '',
        consent: false,
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errors, setErrors] = useState({});

    const validateStep = (currentStep) => {
        const newErrors = {};
        if (currentStep === 1) {
            if (!formData.isHomeowner) newErrors.isHomeowner = t.isHomeownerError;
            if (!formData.location) newErrors.location = t.locationError;
        } else if (currentStep === 2) {
            if (!formData.name) newErrors.name = t.nameError;
            if (!formData.phone && !formData.email) {
                newErrors.phone = t.phoneEmailError;
                newErrors.email = t.phoneEmailError;
            }
            if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = t.emailInvalidError;
            }
        } else if (currentStep === 3) {
            // The message field is optional; only the consent checkbox is required here.
            if (!formData.consent) newErrors.consent = t.consentError;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(step)) return;

        setStatus('loading');

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-lg mx-auto animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.successTitle}</h3>
                <p className="text-gray-600 mb-6">{t.successMessage}</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                >
                    {t.backToHome}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full transition-all duration-300 relative z-20">
            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 w-full">
                <div
                    className="h-full bg-accent transition-all duration-500 ease-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                />
            </div>

            <div className="p-8 sm:p-10">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 mb-3">
                        {copy.heading}
                    </h1>
                    <p className="text-gray-600 text-lg leading-relaxed text-balance">
                        {copy.title}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Step 1 */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    {t.isHomeowner} <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        aria-pressed={formData.isHomeowner === 'Ja'}
                                        className={cn(
                                            "border-2 rounded-xl p-4 cursor-pointer text-center transition-all hover:border-accent/50",
                                            formData.isHomeowner === 'Ja' ? "border-accent bg-accent/10 text-accent font-bold" : "border-gray-200 text-gray-600"
                                        )}
                                        onClick={() => setFormData({ ...formData, isHomeowner: 'Ja' })}
                                    >
                                        <span className="font-medium">{t.yes}</span>
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={formData.isHomeowner === 'Nej'}
                                        className={cn(
                                            "border-2 rounded-xl p-4 cursor-pointer text-center transition-all hover:border-accent/50",
                                            formData.isHomeowner === 'Nej' ? "border-accent bg-accent/10 text-accent font-bold" : "border-gray-200 text-gray-600"
                                        )}
                                        onClick={() => setFormData({ ...formData, isHomeowner: 'Nej' })}
                                    >
                                        <span className="font-medium">{t.no}</span>
                                    </button>
                                </div>
                                {errors.isHomeowner && <p className="text-sm text-red-500 mt-1">{errors.isHomeowner}</p>}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="location" className="block text-sm font-semibold text-gray-700">
                                    {t.location} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className={cn(
                                        "w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all",
                                        errors.location ? "border-red-300 bg-red-50" : "border-gray-300"
                                    )}
                                    placeholder={t.locationPlaceholder}
                                />
                                {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                                    {t.name} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={cn(
                                        "w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all",
                                        errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
                                    )}
                                    placeholder={t.namePlaceholder}
                                />
                                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                                    {t.phone}
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className={cn(
                                        "w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all",
                                        errors.phone ? "border-red-300 bg-red-50" : "border-gray-300"
                                    )}
                                    placeholder={t.phonePlaceholder}
                                />
                                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                                    {t.email}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={cn(
                                        "w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all",
                                        errors.email ? "border-red-300 bg-red-50" : "border-gray-300"
                                    )}
                                    placeholder={t.emailPlaceholder}
                                />
                                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="space-y-2">
                                <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                                    {copy.message || t.message}
                                </label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all resize-none"
                                    placeholder={copy.messagePlaceholder || t.messagePlaceholder}
                                />
                            </div>

                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="consent"
                                        type="checkbox"
                                        checked={formData.consent}
                                        onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="consent" className={cn("font-medium", errors.consent ? "text-red-500" : "text-gray-700")}>
                                        {t.consent}
                                    </label>
                                    {errors.consent && <p className="text-sm text-red-500 mt-1">{errors.consent}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 flex items-center justify-between gap-4">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                disabled={status === 'loading'}
                            >
                                {t.back}
                            </button>
                        ) : (
                            <div></div> /* Spacer */
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center px-8 py-3 text-sm font-medium text-gray-900 bg-accent rounded hover:bg-accent/90 transition-all shadow-sm hover:shadow-md"
                            >
                                {t.next}
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="flex items-center justify-center px-8 py-3 text-sm font-medium text-gray-900 bg-accent rounded hover:bg-accent/90 transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {t.sending}
                                    </>
                                ) : (
                                    t.submit
                                )}
                            </button>
                        )}
                    </div>

                    {status === 'error' && (
                        <div className="flex items-center p-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50">
                            <AlertCircle className="flex-shrink-0 w-4 h-4 mr-2" />
                            <span className="font-medium">{t.error}</span>
                        </div>
                    )}

                    <p className="text-base font-bold text-center text-gray-900 mt-6">
                        {t.disclaimer}
                    </p>
                </form>
            </div>
        </div>
    );
}
