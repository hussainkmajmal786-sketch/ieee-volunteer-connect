import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * MetaTags component for SEO optimization.
 * Handles primary meta tags, Open Graph, and Twitter cards.
 */
const MetaTags = ({ 
    title, 
    description, 
    image = "/og-image.png",
    name = "IEEE Volunteer Connect | CEK",
    type = "website"
}) => {
    const fullTitle = title ? `${title} | ${name}` : name;
    // Preview crawlers need an absolute URL.
    let imageUrl = image;
    try { imageUrl = new URL(image, window.location.origin).toString(); } catch { /* keep as given */ }

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{fullTitle}</title>
            <meta name='description' content={description} />

            {/* Facebook / Open Graph tags */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={imageUrl} />

            {/* Twitter tags */}
            <meta name="twitter:creator" content="IEEE SB CEK" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={imageUrl} />
        </Helmet>
    );
};

export default MetaTags;
