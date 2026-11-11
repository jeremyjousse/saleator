import { describe, it, expect } from 'vitest';
import {
  extractVintedListing,
  cleanAndFilterVintedPhotoUrl,
} from '../src/services/extractor-vinted';
import { extractLeboncoinListing } from '../src/services/extractor-leboncoin';

describe('Extractors', () => {
  describe('cleanAndFilterVintedPhotoUrl', () => {
    it('keeps confirmed /f800/ item photo url', () => {
      const url =
        'https://images1.vinted.net/t/06_00e03_V6nkXmpivkT89PGKn21DTbyA/f800/1794410375.webp?s=3fb5ffe3';
      expect(cleanAndFilterVintedPhotoUrl(url)).toBe(url);
    });

    it('upgrades thumbnail /thumb/ or /f300/ url to /f800/', () => {
      const thumbUrl =
        'https://images1.vinted.net/t/06_00e03_V6nkXmpivkT89PGKn21DTbyA/thumb/1794410375.webp?s=3fb5ffe3';
      const expected =
        'https://images1.vinted.net/t/06_00e03_V6nkXmpivkT89PGKn21DTbyA/f800/1794410375.webp?s=3fb5ffe3';
      expect(cleanAndFilterVintedPhotoUrl(thumbUrl)).toBe(expected);

      const f300Url =
        'https://images1.vinted.net/t/06_00e03_V6nkXmpivkT89PGKn21DTbyA/f300/1794410375.webp?s=3fb5ffe3';
      expect(cleanAndFilterVintedPhotoUrl(f300Url)).toBe(expected);
    });

    it('discards avatar dimensions like 50x50 or 100x100 even inside /t/', () => {
      expect(
        cleanAndFilterVintedPhotoUrl(
          'https://images1.vinted.net/t/02_021e2_wrUcWBKyyopsuM8DCh8ew1f7/50x50/736463e6.jpeg?s=d5862ef',
        ),
      ).toBeNull();
      expect(
        cleanAndFilterVintedPhotoUrl(
          'https://images1.vinted.net/t/02_021e2_wrUcWBKyyopsuM8DCh8ew1f7/100x100/736463e6.jpeg?s=d5862ef',
        ),
      ).toBeNull();
    });

    it('discards avatar, logo, and user profile pictures', () => {
      expect(
        cleanAndFilterVintedPhotoUrl(
          'https://images1.vinted.net/users/12345/avatars/f50/profile.jpg',
        ),
      ).toBeNull();
      expect(cleanAndFilterVintedPhotoUrl('https://images1.vinted.net/assets/logo.svg')).toBeNull();
      expect(
        cleanAndFilterVintedPhotoUrl('https://images1.vinted.net/badges/verified.png'),
      ).toBeNull();
    });

    it('discards non-vinted domains', () => {
      expect(cleanAndFilterVintedPhotoUrl('https://external-ad.com/banner.jpg')).toBeNull();
    });
  });

  describe('extractVintedListing', () => {
    it('extracts all 5 gallery photos when JSON-LD only contains 1 cover photo', () => {
      const doc = document.implementation.createHTMLDocument('Vinted Item Multi Photos');

      // JSON-LD with only 1 single cover photo (standard Vinted behavior)
      const script = doc.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@type': 'Product',
        name: 'Ligature clarinette Si bémol Rovner Dark 1R',
        description: 'Ligature clarinette en très bon état avec couvre-bec',
        image: 'https://images1.vinted.net/t/01_abc/f800/photo1.webp',
        offers: {
          price: '25.00',
          priceCurrency: 'EUR',
        },
      });
      doc.head.appendChild(script);

      // DOM Gallery holding all 5 photos
      const gallery = doc.createElement('div');
      gallery.setAttribute('data-testid', 'item-photos');
      gallery.innerHTML = `
        <div data-testid="item-photo-0">
          <a href="https://images1.vinted.net/t/01_abc/f800/photo1.webp"><img src=".../thumb1.webp"></a>
        </div>
        <div data-testid="item-photo-1">
          <a href="https://images1.vinted.net/t/02_def/f800/photo2.webp"><img src=".../thumb2.webp"></a>
        </div>
        <div data-testid="item-photo-2">
          <a href="https://images1.vinted.net/t/03_ghi/f800/photo3.webp"><img src=".../thumb3.webp"></a>
        </div>
        <div data-testid="item-photo-3">
          <a href="https://images1.vinted.net/t/04_jkl/f800/photo4.webp"><img src=".../thumb4.webp"></a>
        </div>
        <div data-testid="item-photo-4">
          <a href="https://images1.vinted.net/t/05_mno/f800/photo5.webp"><img src=".../thumb5.webp"></a>
        </div>
      `;
      doc.body.appendChild(gallery);

      const listing = extractVintedListing(doc);
      expect(listing).not.toBeNull();
      expect(listing?.title).toBe('Ligature clarinette Si bémol Rovner Dark 1R');
      expect(listing?.price).toBe(25);
      expect(listing?.photos.length).toBe(5);
      expect(listing?.photos[0]?.url).toBe('https://images1.vinted.net/t/01_abc/f800/photo1.webp');
      expect(listing?.photos[4]?.url).toBe('https://images1.vinted.net/t/05_mno/f800/photo5.webp');
    });

    it('ignores user-menu-button header avatar and similar items in DOM extraction', () => {
      const doc = document.implementation.createHTMLDocument('Vinted Item');

      // User menu button with header avatar (matching user screenshot)
      const userMenu = doc.createElement('button');
      userMenu.id = 'user-menu-button';
      userMenu.setAttribute('data-testid', 'user-menu-button');
      userMenu.innerHTML = `
        <div class="u-flexbox u-align-items-center">
          <figure class="_8npoGG_header-avatar">
            <div class="web_ui__Image__image web_ui__Image__circle">
              <img src="https://images1.vinted.net/t/02_021e2_wrUcWBKyyopsuM8DCh8ew1f7/50x50/736463e6.jpeg?s=d5862ef" alt="anne1435" class="web_ui__Image__content">
            </div>
          </figure>
        </div>
      `;
      doc.body.appendChild(userMenu);

      // Main item view & title
      const h1 = doc.createElement('h1');
      h1.setAttribute('data-testid', 'item-title');
      h1.textContent = 'Pull en cachemire';
      doc.body.appendChild(h1);

      const price = doc.createElement('div');
      price.setAttribute('data-testid', 'item-price');
      price.textContent = '35,00 €';
      doc.body.appendChild(price);

      // Main item gallery
      const gallery = doc.createElement('div');
      gallery.setAttribute('data-testid', 'item-photos');
      gallery.innerHTML = `
        <div data-testid="item-photo">
          <a href="https://images1.vinted.net/t/03_ghi/f800/pull.webp?s=abcdef">
            <img src="https://images1.vinted.net/t/03_ghi/thumb/pull.webp?s=abcdef">
          </a>
        </div>
      `;
      doc.body.appendChild(gallery);

      // Other clients items below (similar items)
      const similar = doc.createElement('div');
      similar.setAttribute('data-testid', 'similar-items');
      similar.innerHTML = `
        <div data-testid="item-photo">
          <a href="https://images1.vinted.net/t/04_jkl/f800/other_client_item.webp"></a>
        </div>
      `;
      doc.body.appendChild(similar);

      const listing = extractVintedListing(doc);
      expect(listing).not.toBeNull();
      expect(listing?.title).toBe('Pull en cachemire');
      expect(listing?.price).toBe(35);
      // Strictly 1 photo: the main item's photo
      expect(listing?.photos.length).toBe(1);
      expect(listing?.photos[0]?.url).toBe(
        'https://images1.vinted.net/t/03_ghi/f800/pull.webp?s=abcdef',
      );
    });
  });

  describe('extractLeboncoinListing', () => {
    it('extracts listing from __NEXT_DATA__ json', () => {
      const doc = document.implementation.createHTMLDocument('LBC Item');
      const script = doc.createElement('script');
      script.id = '__NEXT_DATA__';
      script.type = 'application/json';
      script.textContent = JSON.stringify({
        props: {
          pageProps: {
            ad: {
              list_id: 12345678,
              subject: 'Table basse vintage scandinave',
              body: 'Superbe table basse en teck des années 60',
              price: [80],
              category_name: 'Ameublement',
              images: {
                urls: ['https://img.leboncoin.fr/ad-image/table.jpg'],
              },
              location: {
                city: 'Lyon',
                zipcode: '69002',
              },
              attributes: [{ key: 'item_condition', value_label: 'Bon état' }],
            },
          },
        },
      });
      doc.head.appendChild(script);

      const listing = extractLeboncoinListing(doc);
      expect(listing).not.toBeNull();
      expect(listing?.title).toBe('Table basse vintage scandinave');
      expect(listing?.price).toBe(80);
      expect(listing?.condition).toBe('good');
      expect(listing?.location).toBe('Lyon');
      expect(listing?.category.normalized).toBe('home');
      expect(listing?.source).toBe('leboncoin');
    });
  });
});
