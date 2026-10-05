import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, MailX, AlertTriangle } from "lucide-react";
import MetaTags from "../shared/MetaTags";
import { api } from "../lib/api";

/** Landing page for the links in newsletter emails: confirmed / unsubscribe. */
export default function NewsletterPage() {
    const [params] = useSearchParams();
    const [state, setState] = useState("idle"); // idle | working | done | error
    const [error, setError] = useState("");
    const status = params.get("status");
    const unsubscribing = params.get("action") === "unsubscribe" && params.get("id") && params.get("t");

    const unsubscribe = async () => {
        setState("working");
        try {
            await api("/api/newsletter/unsubscribe", { id: params.get("id"), t: params.get("t") });
            setState("done");
        } catch (err) {
            setError(err.message);
            setState("error");
        }
    };

    let body;
    if (unsubscribing && state !== "done") {
        body = (
            <>
                <MailX className="w-14 h-14 text-ieee-blue mx-auto mb-4" />
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Unsubscribe from the newsletter?</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">You will stop receiving IEEE SB CEK event updates by email.</p>
                {state === "error" && <p role="alert" className="text-sm text-red-500 mb-4">{error}</p>}
                <button onClick={unsubscribe} disabled={state === "working"} className="btn-primary !px-8 !py-3 disabled:opacity-60">
                    {state === "working" ? "Unsubscribing…" : "Yes, unsubscribe me"}
                </button>
            </>
        );
    } else if (unsubscribing || status === "unsubscribed") {
        body = (<><CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" /><h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">You&apos;re unsubscribed</h1><p className="text-gray-500 dark:text-gray-400">You won&apos;t get any more newsletters. You can subscribe again from the footer any time.</p></>);
    } else if (status === "confirmed") {
        body = (<><CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" /><h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">You&apos;re subscribed! 🎉</h1><p className="text-gray-500 dark:text-gray-400">Thanks for confirming. You&apos;ll hear from us about new events and deadlines.</p></>);
    } else {
        body = (<><AlertTriangle className="w-14 h-14 text-amber-500 mx-auto mb-4" /><h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">This link isn&apos;t valid</h1><p className="text-gray-500 dark:text-gray-400">It may be incomplete or already used. Subscribe again from the footer to get a new confirmation email.</p></>);
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
            <MetaTags title="Newsletter" description="IEEE SB CEK newsletter" />
            {body}
            <Link to="/events" className="inline-block mt-8 text-sm font-semibold text-ieee-blue hover:underline">Browse events</Link>
        </div>
    );
}
