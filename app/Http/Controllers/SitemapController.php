<?php

namespace App\Http\Controllers;

use App\Models\DailyGame;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Generate and return the sitemap.xml
     */
    public function index(): Response
    {
        $baseUrl = config('app.url');
        $games = DailyGame::where('game_date', '<=', today())
            ->orderByDesc('game_date')
            ->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        // Home page (today's game)
        $xml .= '  <url>'."\n";
        $xml .= '    <loc>'.htmlspecialchars($baseUrl.'/daily').'</loc>'."\n";
        $xml .= '    <changefreq>daily</changefreq>'."\n";
        $xml .= '    <priority>1.0</priority>'."\n";
        $xml .= '  </url>'."\n";

        // Individual game pages
        foreach ($games as $game) {
            $url = route('game', ['date' => $game->game_date->format('Y-m-d')]);
            $lastmod = $game->updated_at->toAtomString();

            $xml .= '  <url>'."\n";
            $xml .= '    <loc>'.htmlspecialchars($url).'</loc>'."\n";
            $xml .= '    <lastmod>'.htmlspecialchars($lastmod).'</lastmod>'."\n";
            $xml .= '    <changefreq>monthly</changefreq>'."\n";
            $xml .= '    <priority>0.8</priority>'."\n";
            $xml .= '  </url>'."\n";
        }

        $xml .= '</urlset>';

        return response($xml, 200)
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Generate and return robots.txt
     */
    public function robots(): Response
    {
        $sitemapUrl = route('sitemap');
        $content = "User-agent: *\n";
        $content .= "Allow: /\n\n";
        $content .= "Sitemap: {$sitemapUrl}\n";

        return response($content, 200)
            ->header('Content-Type', 'text/plain');
    }
}
