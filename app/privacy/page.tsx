import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'Privacy Policy – Roast My UI',
    description: 'Privacy policy for the Roast My UI web application.',
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 text-white flex flex-col items-center pt-12 pb-24 px-4 md:px-8">
            {/* Hero Section */}
            <section className="text-center mb-12 max-w-2xl pt-20">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-pink-500">
                    Privacy Policy
                </h1>
                <p className="text-lg text-neutral-300 mb-4">
                    Effective date: November, 26, 2025 – Your data, our responsibility.
                </p>
                <Link href="/" className="inline-block px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-transform transform hover:scale-105">
                    ← Back to Home
                </Link>
            </section>

            {/* Intro Text */}
            <article className="prose prose-invert max-w-4xl w-full">
                <p>
                    This privacy policy explains what data the <strong>Roast My UI</strong> web application (&quot;the Service&quot;) collects, how it is used, and how it is protected.
                </p>

                {/* Data‑Usage Table */}
                <h2 id="data-usage" className="text-2xl font-bold mt-8 mb-4">Data Usage Disclosure (as submitted to the Chrome Web Store)</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border border-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-2 text-left">Data Category</th>
                                <th className="p-2 text-left">Collected Now?</th>
                                <th className="p-2 text-left">Collected In‑Future? (with explicit opt‑in)</th>
                                <th className="p-2 text-left">Explanation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {/* Rows – kept from original content */}
                            {[
                                { category: "Personally identifiable information", now: "No", future: "No", explanation: "The extension never asks for or stores any PII." },
                                { category: "Health information", now: "No", future: "No", explanation: "No health‑related data is relevant to the extension’s purpose." },
                                { category: "Financial and payment information", now: "No", future: "No", explanation: "The extension is free and does not handle payments." },
                                { category: "Authentication information", now: "No", future: "No", explanation: "No login or authentication is performed inside the extension." },
                                { category: "Personal communications", now: "No", future: "No", explanation: "The extension never reads or transmits personal communications." },
                                { category: "Location", now: "No", future: "Possible – only if a future “regional‑settings” feature is added and the user explicitly enables it.", explanation: "Currently we do not collect any location data." },
                                { category: "Web history", now: "No", future: "No", explanation: "We only access the active tab when the user clicks the extension; we do not record a browsing history." },
                                { category: "User activity", now: "Limited – the click that launches the extension is required.", future: "Possible – optional analytics events may be sent if the user opts‑in via a settings toggle.", explanation: "No continuous monitoring; only a single activation event is captured." },
                                { category: "Website content", now: "Yes", future: "Possible – future “save‑roast‑report” feature could store a copy of the report on the server, but only with explicit user consent.", explanation: "Required to feed the AI “roast” engine with the page’s content (URL, HTML/Screenshot). Data is held in memory only for the duration of the request and discarded immediately after the response is returned." },
                            ].map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-neutral-900" : "bg-neutral-950"}>
                                    <td className="p-2 border-t border-gray-700">{row.category}</td>
                                    <td className="p-2 border-t border-gray-700">{row.now}</td>
                                    <td className="p-2 border-t border-gray-700">{row.future}</td>
                                    <td className="p-2 border-t border-gray-700">{row.explanation}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Protection Section */}
                <h2 className="text-2xl font-bold mt-8 mb-4">How We Protect Your Data</h2>
                <ul className="list-disc list-inside space-y-2 text-neutral-300">
                    <li>All communication between the service and our backend AI is encrypted with <strong>HTTPS</strong>.</li>
                    <li>Data is processed in a <strong>stateless</strong> manner – we do not keep persistent logs of page content or URLs.</li>
                    <li>Only the minimal information required to generate a roast is transmitted.</li>
                </ul>

                {/* Future Collection */}
                <h2 className="text-2xl font-bold mt-8 mb-4">Future Data Collection</h2>
                <p className="text-neutral-300">
                    If we later add features such as usage analytics, error reporting, or personalized settings sync, we will:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-neutral-300 ml-4">
                    <li>Ask for explicit permission via a new optional setting in the UI.</li>
                    <li>Update this privacy policy on the site and on the Chrome Web Store.</li>
                    <li>Provide a clear opt‑out mechanism for users.</li>
                </ol>

                {/* Rights & Contact */}
                <h2 className="text-2xl font-bold mt-8 mb-4">Your Rights</h2>
                <p className="text-neutral-300">
                    You may request deletion of any data you have voluntarily submitted (e.g., feedback) by contacting us at <a href="mailto:drewsepeczi@gmail.com" className="underline text-rose-400">drewsepeczi@gmail.com</a>. We will respond within 30 days.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
                <p className="text-neutral-300">
                    If you have any questions about this privacy policy, please email us at <a href="mailto:drewsepeczi@gmail.com" className="underline text-rose-400">drewsepeczi@gmail.com</a>.
                </p>
            </article>
        </main>
    );
}
