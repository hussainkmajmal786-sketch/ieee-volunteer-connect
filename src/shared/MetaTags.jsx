import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * MetaTags component for SEO optimization.
 * Handles primary meta tags, Open Graph, and Twitter cards.
 */
const MetaTags = ({ 
    title, 
    description, 
    image = "/favicon.svg",
    name = "IEEE Volunteer Connect | CEK",
    type = "website"
}) => {
    const fullTitle = title ? `${title} | ${name}` : name;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{fullTitle}</title>
            <meta name='description' content={description} />

            {/* Facebook / Open Graph tags */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter tags */}
            <meta name="twitter:creator" content="IEEE SB CEK" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};

export default MetaTags;
