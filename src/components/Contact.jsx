import React, { useState, useRef } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";

export default function Contact({ title, labels, contactInfo, lang = 'sv' }) {
    const kicker = lang === 'en' ? 'CONTACT' : 'KONTAKT';
    const addressText = 'Alängsvägen 16, 123 52 Farsta';
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
        consent: false
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [captchaToken, setCaptchaToken] = useState(null);
    const recaptchaRef = useRef(null);
    const [mounted, setMounted] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleCaptchaChange = (token) => {
        setCaptchaToken(token);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!captchaToken) {
            alert("Please complete the CAPTCHA");
            return;
        }

        setStatus('loading');

        try {
            const response = await fetch('/api/kontakt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...formData, token: captchaToken }),
            });

            const result = await response.json();

            if (result.status === 'success') {
                setStatus('success');
                setFormData({ name: '', email: '', phone: '', message: '', consent: false });
                setCaptchaToken(null);
                recaptchaRef.current.reset();
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <section id="kontakt" className="section bg-white relative">
            <div className="container mx-auto px-5 md:px-8">
                <div className="section-kicker mb-3"><span></span>{kicker}</div>
            </div>
            <div className="container mx-auto px-5 md:px-8 grid lg:grid-cols-2 gap-12">
                {/* Form */}
                <div className="bg-white border border-gray-100 p-8 md:p-10 rounded-2xl shadow-lg order-2 lg:order-1">
                    {status === 'success' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                            <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
                            <h3 className="text-2xl text-gray-900 font-bold mb-2">{labels.successTitle}</h3>
                            <p className="text-gray-600">{labels.successMessage}</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-8 text-accent underline hover:text-gray-900"
                            >
                                {labels.sendAnother}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="contact-name" className="block text-sm text-gray-600 mb-2">{labels.name}</label>
                                <input
                                    id="contact-name"
                                    type="text"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 text-gray-900 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-gray-400"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="contact-email" className="block text-sm text-gray-600 mb-2">{labels.email}</label>
                                    <input
                                        id="contact-email"
                                        type="email"
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 text-gray-900 focus:outline-none focus:border-accent transition-all placeholder-gray-400"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="contact-phone" className="block text-sm text-gray-600 mb-2">{labels.phone} ({labels.optional})</label>
                                    <input
                                        id="contact-phone"
                                        type="tel"
                                        className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 text-gray-900 focus:outline-none focus:border-accent transition-all placeholder-gray-400"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="contact-message" className="block text-sm text-gray-600 mb-2">{labels.message}</label>
                                <textarea
                                    id="contact-message"
                                    required
                                    rows={4}
                                    className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 text-gray-900 focus:outline-none focus:border-accent transition-all resize-none placeholder-gray-400"
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>

                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="consent"
                                    required
                                    className="mt-1 bg-gray-50 border-gray-200 rounded text-accent focus:ring-accent"
                                    checked={formData.consent}
                                    onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                                />
                                <label htmlFor="consent" className="text-sm text-muted leading-tight">
                                    {labels.consent}
                                </label>
                            </div>

                            <div className="mb-4">
                                {mounted && (
                                    <ReCAPTCHA
                                        ref={recaptchaRef}
                                        sitekey="6LfNTEUsAAAAAGV1DEOkHur2a0kAHMOjqxXcEd6E"
                                        onChange={handleCaptchaChange}
                                    />
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading' || !captchaToken}
                                className="w-full bg-accent hover:bg-accent-hover text-gray-900 font-bold py-4 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 shadow-md"
                            >
                                {status === 'loading' ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        <span>{labels.submit}</span>
                                        <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Contact Info & Map Column */}
                <div className="flex flex-col gap-8 h-full order-1 lg:order-2">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8">{title}</h2>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="contact-avatar">P</span>
                                <div>
                                    <div className="text-gray-500 text-xs uppercase tracking-wider">{labels.contactPerson}</div>
                                    <div className="text-gray-900 font-bold">{contactInfo.name}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="contact-avatar" aria-hidden="true">📞</span>
                                <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="text-gray-900 hover:text-accent transition-colors font-semibold">
                                    {contactInfo.phone}
                                </a>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="contact-avatar" aria-hidden="true">✉️</span>
                                <a href={`mailto:${contactInfo.email}`} className="text-gray-900 hover:text-accent transition-colors font-semibold">
                                    {contactInfo.email}
                                </a>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="contact-avatar" aria-hidden="true">📍</span>
                                <span className="text-gray-900 font-semibold">{addressText}</span>
                            </div>
                        </div>
                    </div>

                    {/* Google Map */}
                    <div className="w-full h-80 md:h-full min-h-[300px] rounded-2xl overflow-hidden shadow-md border border-gray-100 relative bg-gray-100">
                        <iframe
                            src="https://www.google.com/maps?q=Al%C3%A4ngsv%C3%A4gen%2016%2C%20123%2052%20Farsta&output=embed"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Google Map"
                        ></iframe>
                    </div>
                </div>
            </div>
        </section>
    );
}
