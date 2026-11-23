// Starbucks concept: catalog, customizing, reviews, bag, account and rewards, plus the 3D cup.
// Everything is a demo: nothing is sent anywhere, state lives only in this browser.
import * as THREE from 'three';
import { RGBELoader } from '/lib/addons/loaders/RGBELoader.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + n.toFixed(2);
const S = {
  get(k, d) { try { const v = localStorage.getItem('sbx-' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('sbx-' + k, JSON.stringify(v)); } catch {} }
};

// ---------- smooth scroll ----------
let lenis = null;
if (!reduce && window.Lenis) { lenis = new Lenis({ lerp: .09 }); const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
const scrollToEl = el => lenis ? lenis.scrollTo(el, { offset: -72, duration: 1.6 }) : el.scrollIntoView({ behavior: 'smooth' });
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const id = a.getAttribute('href'); if (id.length < 2) return; const el = $(id); if (!el) return; e.preventDefault(); scrollToEl(el); }));

// ---------- catalog ----------
const MILK = [['2% milk', 0, 'Milk'], ['Whole milk', 0, 'Milk'], ['Nonfat milk', 0, 'Milk'], ['Oat milk', .7, ''], ['Almond milk', .7, 'Tree nuts'], ['Soy milk', .7, 'Soy'], ['Coconut milk', .7, '']];
const SYR = [['Extra espresso shot', .9, ''], ['Vanilla syrup', .8, ''], ['Caramel syrup', .8, ''], ['Hazelnut syrup', .8, ''], ['Sugar-free vanilla', .8, ''], ['Caramel drizzle', .6, 'Milk'], ['Vanilla cold foam', 1.25, 'Milk']];
const P3 = t => ({ tall: t, grande: +(t + .5).toFixed(2), venti: +(t + 1).toFixed(2) });
const SZ = { tall: .86, grande: 1, venti: 1.13 };
const LIST = [
  // holiday drinks
  { id: 'peppermint-mocha', n: 'Peppermint Mocha', ph: 'hol-peppermint-mocha', cat: 'drink', hol: 1, temp: 'hot', price: P3(5.25), k: 440, d: 'Espresso, steamed milk and mocha sauce with peppermint syrup, topped with whipped cream and dark chocolate curls. Served in the red holiday cup.', r: 4.8, c: 2140, tags: ['sweet'], milk: 1,
    adds: [['Extra peppermint pump', .8, ''], ['White mocha swirl', .8, 'Milk'], ...SYR.slice(0, 2)], ing: [['Espresso', '', 0], ['Mocha sauce', '', 0], ['Peppermint syrup', '', 1], ['Whipped cream', 'Milk', 1], ['Dark chocolate curls', 'Milk,Soy', 1]],
    rv: [['Maria', 5, 'Tastes exactly like December. I get it with oat milk and it is still rich.'], ['Jordan', 5, 'The chocolate curls on top are the best part.'], ['Sam', 4, 'Quite sweet, so I ask for two pumps of peppermint instead of four.']] },
  { id: 'gingerbread-latte', n: 'Gingerbread Latte', ph: 'hol-gingerbread-latte', cat: 'drink', hol: 1, temp: 'hot', price: P3(5.15), k: 330, d: 'Espresso and steamed milk with gingerbread syrup, whipped cream and a dusting of nutmeg.', r: 4.7, c: 1380, tags: ['sweet'], milk: 1,
    adds: [['Extra gingerbread pump', .8, ''], ...SYR.slice(0, 3)], ing: [['Espresso', '', 0], ['Gingerbread syrup', '', 1], ['Whipped cream', 'Milk', 1], ['Nutmeg topping', '', 1]],
    rv: [['Elena', 5, 'Warm, spicy and not too sweet. My go-to after work.'], ['Chris', 5, 'Smells like a bakery. Oat milk works great with it.'], ['Priya', 4, 'Lovely. I ask for the whipped cream on the side.']] },
  { id: 'peppermint-cocoa', n: 'Peppermint Hot Chocolate', ph: 'hol-peppermint-cocoa', cat: 'drink', hol: 1, temp: 'hot', price: P3(4.45), k: 400, d: 'Steamed milk with mocha sauce and peppermint syrup, whipped cream and crushed peppermint on top. No coffee.', r: 4.6, c: 990, tags: ['sweet', 'nocoffee'], milk: 1,
    adds: [['Extra peppermint pump', .8, ''], ['Marshmallows', .5, '']], ing: [['Mocha sauce', '', 0], ['Peppermint syrup', '', 1], ['Whipped cream', 'Milk', 1], ['Crushed peppermint', '', 1]],
    rv: [['Lily', 5, 'My kids ask for this every time we pass the store.'], ['Marco', 4, 'Great when you do not want caffeine at night.']] },
  { id: 'eggnog-latte', n: 'Eggnog Latte', ph: 'hol-eggnog-latte', cat: 'drink', hol: 1, temp: 'hot', price: P3(5.45), k: 460, d: 'Espresso with steamed eggnog and milk, finished with ground nutmeg.', r: 4.4, c: 860, tags: [], al: 'Milk,Egg',
    adds: SYR.slice(0, 2), ing: [['Espresso', '', 0], ['Nutmeg topping', '', 1]],
    rv: [['Tom', 5, 'Creamy and rich. It is back every year and I wait for it.'], ['Ana', 4, 'Heavy, so I get a tall. Perfect with a cinnamon roll.']] },
  { id: 'gingerbread-mocha', n: 'Gingerbread Mocha', ph: 'drink-mocha', cat: 'drink', hol: 1, temp: 'hot', price: P3(5.45), k: 390, d: 'Espresso, mocha sauce and gingerbread syrup with steamed milk, finished with cocoa.', r: 4.5, c: 540, tags: ['sweet', 'strong'], milk: 1,
    adds: SYR.slice(0, 3), ing: [['Espresso', '', 0], ['Mocha sauce', '', 0], ['Gingerbread syrup', '', 1], ['Cocoa dusting', '', 1]],
    rv: [['Felix', 5, 'Chocolate and gingerbread together, why is this not on the menu all year?'], ['Nora', 4, 'Strong and cosy. Add an extra shot if you need to wake up.']] },
  // holiday food
  { id: 'cakepop-holiday', n: 'Snowy White Cake Pop', ph: 'hol-cakepop-holiday', cat: 'bakery', hol: 1, price: 3.25, k: 170, d: 'Vanilla cake and buttercream, dipped in white chocolate and dusted with sugar snow. Holiday only.', r: 4.8, c: 1720, al: 'Milk,Soy,Wheat,Egg', ing: [['Sugar snow topping', '', 1]],
    rv: [['Zoe', 5, 'Tiny, but the best part of my order.'], ['Ben', 5, 'Bought three for the office. No regrets.']] },
  { id: 'gingerbread-cookie', n: 'Gingerbread Cookie', ph: 'hol-gingerbread-cookie', cat: 'bakery', hol: 1, price: 2.95, k: 220, d: 'Soft, spiced gingerbread with sugar icing, baked for the season.', r: 4.5, c: 430, al: 'Wheat,Egg,Milk', ing: [['Sugar icing', '', 1]],
    rv: [['Hugo', 5, 'Soft in the middle, just how it should be.'], ['Amira', 4, 'Cute and tasty, great with a latte.']] },
  // drinks
  { id: 'caramel-macchiato', n: 'Caramel Macchiato', ph: 'drink-caramel-macchiato', cat: 'drink', temp: 'hot', price: P3(4.95), k: 250, d: 'Steamed milk with vanilla syrup, marked with espresso and finished with a caramel drizzle.', r: 4.7, c: 3210, tags: ['sweet'], milk: 1,
    adds: SYR, ing: [['Espresso', '', 0], ['Vanilla syrup', '', 1], ['Caramel drizzle', 'Milk', 1]],
    rv: [['Hana', 5, 'Hot or iced, it is always good. I add an extra shot.'], ['Leo', 5, 'A classic. The caramel on top makes it.'], ['Ines', 4, 'A bit sweet for me. Half the vanilla is perfect.']] },
  { id: 'latte', n: 'Caffè Latte', ph: 'drink-latte', cat: 'drink', temp: 'hot', price: P3(4.25), k: 190, d: 'Rich espresso balanced with steamed milk and a light layer of foam.', r: 4.6, c: 2870, tags: [], milk: 1,
    adds: SYR, ing: [['Espresso', '', 0]],
    rv: [['Noah', 5, 'Simple and done right. Oat milk latte every morning.'], ['Mia', 4, 'Smooth. Try it with the vanilla syrup.']] },
  { id: 'flat-white', n: 'Flat White', ph: 'drink-cappuccino', cat: 'drink', temp: 'hot', price: P3(4.75), k: 170, d: 'Ristretto shots with a thin layer of velvety whole-milk microfoam and a latte art dot.', r: 4.5, c: 1150, tags: ['strong'], milk: 1, milkDef: 'Whole milk',
    adds: SYR.slice(0, 5), ing: [['Ristretto shots', '', 0]],
    rv: [['Oliver', 5, 'More coffee taste than a latte. My favourite.'], ['Sofia', 4, 'Small but strong. Good latte art too.']] },
  { id: 'caramel-frapp', n: 'Caramel Frappuccino', ph: 'drink-frapp', cat: 'drink', temp: 'iced', price: P3(5.45), k: 380, d: 'Caramel syrup blended with coffee, milk and ice, topped with whipped cream and caramel drizzle.', r: 4.6, c: 2550, tags: ['sweet'], milk: 1,
    adds: SYR.slice(0, 4), ing: [['Coffee', '', 0], ['Caramel syrup', '', 1], ['Whipped cream', 'Milk', 1], ['Caramel drizzle', 'Milk', 1]],
    rv: [['Emma', 5, 'Summer in a cup, even in winter.'], ['Lucas', 4, 'Very sweet. I get it without whipped cream.']] },
  { id: 'java-mint-frapp', n: 'Chocolate Java Mint Frappuccino', ph: 'drink-mocha-frapp', cat: 'drink', temp: 'iced', price: P3(5.75), k: 400, d: 'Mocha sauce, peppermint and chocolate chips blended with coffee and ice, topped with whipped cream.', r: 4.5, c: 740, tags: ['sweet'], milk: 1,
    adds: [['Extra chocolate chips', .5, 'Milk,Soy'], ...SYR.slice(0, 1)], ing: [['Coffee', '', 0], ['Mocha sauce', '', 0], ['Peppermint syrup', '', 1], ['Chocolate chips', 'Milk,Soy', 1], ['Whipped cream', 'Milk', 1]],
    rv: [['Ava', 5, 'Like a mint chocolate milkshake with coffee.'], ['Daniel', 4, 'Really good. Ask for extra chips.']] },
  { id: 'coffee-frapp', n: 'Coffee Frappuccino', ph: 'drink-frapp-coffee', cat: 'drink', temp: 'iced', price: P3(4.95), k: 230, d: 'Coffee blended with milk and ice. The original Frappuccino.', r: 4.4, c: 1990, tags: [], milk: 1,
    adds: [['Whipped cream', 0, 'Milk'], ...SYR.slice(0, 4)], ing: [['Coffee', '', 0], ['Classic syrup', '', 1]],
    rv: [['Ethan', 4, 'Not too sweet, just cold coffee done well.'], ['Isla', 5, 'Add caramel syrup and it is perfect.']] },
  { id: 'strawberry-frapp', n: 'Strawberry Crème Frappuccino', ph: 'drink-strawberry-frapp', cat: 'drink', temp: 'iced', price: P3(5.25), k: 370, d: 'Strawberry purée blended with milk and ice, topped with whipped cream. No coffee.', r: 4.4, c: 1210, tags: ['sweet', 'nocoffee'], milk: 1,
    adds: [['Vanilla syrup', .8, '']], ing: [['Strawberry purée', '', 0], ['Whipped cream', 'Milk', 1]],
    rv: [['Chloe', 5, 'Pink, sweet and fun. My daughter loves it.'], ['Max', 4, 'Tastes like a strawberry milkshake.']] },
  { id: 'matcha', n: 'Matcha Latte', ph: 'drink-matcha', cat: 'drink', temp: 'iced', price: P3(4.95), k: 200, d: 'Smooth, sweetened matcha green tea with milk, served hot or over ice.', r: 4.5, c: 1640, tags: ['nocoffee'], milk: 1,
    adds: [['Vanilla syrup', .8, ''], ['Vanilla cold foam', 1.25, 'Milk']], ing: [['Matcha', '', 0], ['Classic syrup', '', 1]],
    rv: [['Yuki', 5, 'Get it with oat milk, it tastes like a dessert.'], ['Sara', 4, 'Smooth, a little sweet. I ask for less syrup.']] },
  { id: 'cold-brew', n: 'Cold Brew', ph: 'drink-cold-brew', cat: 'drink', temp: 'iced', price: P3(4.45), k: 5, d: 'Small-batch coffee steeped cold for 20 hours, served over ice. Smooth and naturally sweet.', r: 4.6, c: 2010, tags: ['strong'],
    adds: [['Splash of milk', 0, 'Milk'], ['Vanilla sweet cream', .9, 'Milk'], ['Vanilla cold foam', 1.25, 'Milk'], ['Caramel syrup', .8, '']], ing: [['Cold brew coffee', '', 0], ['Ice', '', 1]],
    rv: [['Adam', 5, 'Smooth, no bitterness. Best with sweet cream.'], ['Julia', 5, 'Strong enough to get me through the afternoon.']] },
  { id: 'iced-coffee', n: 'Iced Coffee', ph: 'drink-iced', cat: 'drink', temp: 'iced', price: P3(3.95), k: 80, d: 'Brewed hot, chilled and poured over ice. Lightly sweetened.', r: 4.3, c: 1450, tags: ['strong'],
    adds: [['Splash of milk', 0, 'Milk'], ['Oat milk', .7, ''], ['Vanilla syrup', .8, '']], ing: [['Coffee', '', 0], ['Classic syrup', '', 1]],
    rv: [['Ryan', 4, 'Cheap and cheerful. Ask for it unsweetened.'], ['Maya', 4, 'Refreshing, I add a splash of oat milk.']] },
  // bakery
  { id: 'carrot-cake', n: 'Carrot Cake', ph: 'food-carrot-cake', cat: 'bakery', price: 4.75, k: 490, d: 'Spiced carrot cake with walnuts, layered with cream cheese frosting.', r: 4.8, c: 1030, al: 'Milk,Egg,Wheat', ing: [['Walnuts', 'Tree nuts', 1], ['Cream cheese frosting', 'Milk', 0]], big: 1,
    rv: [['Grace', 5, 'Moist with lots of frosting. You can ask them to leave out the walnuts.'], ['Ali', 5, 'Best slice of cake I have had in a coffee shop.']] },
  { id: 'cheesecake', n: 'Strawberry Cheesecake', ph: 'food-cheesecake', cat: 'bakery', price: 4.95, k: 420, d: 'Creamy New York style cheesecake on a graham crust with a strawberry topping.', r: 4.7, c: 880, al: 'Milk,Egg,Wheat', ing: [['Strawberry topping', '', 1]],
    rv: [['Lena', 5, 'Creamy and not too heavy. The strawberry sauce makes it.'], ['Victor', 4, 'Good with a flat white.']] },
  { id: 'cakepop-birthday', n: 'Birthday Cake Pop', ph: 'food-cakepop-birthday', cat: 'bakery', price: 2.95, k: 170, d: 'Vanilla cake and icing, dipped in pink icing with white sprinkles.', r: 4.7, c: 2460, al: 'Milk,Soy,Wheat,Egg', ing: [['Sprinkles', '', 1]],
    rv: [['Bella', 5, 'Always grab one with my drink.'], ['Omar', 4, 'Sweet, cute, gone in two bites.']] },
  { id: 'lemon-loaf', n: 'Iced Lemon Loaf', ph: 'food-lemon-loaf', cat: 'bakery', price: 3.95, k: 470, d: 'Zesty lemon pound cake under a thick layer of sweet lemon icing.', r: 4.6, c: 1490, al: 'Wheat,Egg,Milk', ing: [['Lemon icing', '', 1]], wide: 1,
    rv: [['Clara', 5, 'Tangy and sweet. Perfect afternoon treat.'], ['Paul', 4, 'Very good, the icing is generous.']] },
  { id: 'croissant', n: 'Butter Croissant', ph: 'food-croissant', cat: 'bakery', price: 3.75, k: 260, d: 'Flaky, golden butter croissant. Ask us to warm it.', r: 4.6, c: 1320, al: 'Milk,Wheat,Egg', adds: [['Warmed', 0, ''], ['Butter', .3, 'Milk'], ['Strawberry jam', .5, '']],
    rv: [['Camille', 5, 'Ask for it warmed. Crispy outside, soft inside.'], ['Ivan', 4, 'Buttery and fresh in the morning.']] },
  { id: 'cinnamon', n: 'Cinnamon Roll', ph: 'food-cinnamon', cat: 'bakery', price: 4.25, k: 420, d: 'Soft roll swirled with cinnamon sugar and topped with icing.', r: 4.6, c: 970, al: 'Wheat,Egg', ing: [['Icing', 'Milk', 1]], adds: [['Warmed', 0, '']],
    rv: [['Rosa', 5, 'Warm it up. Trust me.'], ['Mateo', 4, 'Soft and sweet, lovely with a latte.']] },
  { id: 'muffin', n: 'Blueberry Muffin', ph: 'food-muffin', cat: 'bakery', price: 3.45, k: 360, d: 'Moist muffin packed with blueberries, with a crumb topping.', r: 4.4, c: 760, al: 'Wheat,Egg,Milk', ing: [['Crumb topping', '', 1]],
    rv: [['Kate', 4, 'Lots of blueberries, nice and moist.'], ['Jon', 4, 'Good grab-and-go breakfast.']] },
  { id: 'brownie', n: 'Double Chocolate Brownie', ph: 'food-brownie', cat: 'bakery', price: 3.65, k: 480, d: 'Fudgy chocolate brownie with chocolate chunks and toasted nuts.', r: 4.5, c: 690, al: 'Wheat,Egg,Milk,Soy', ing: [['Toasted nuts', 'Tree nuts', 1]],
    rv: [['Mila', 5, 'Fudgy in the middle. Order it without nuts if you need to.'], ['Sean', 4, 'Rich, share it or regret it.']] },
  // meals
  { id: 'breakfast-sandwich', n: 'Bacon, Egg & Cheese Sandwich', ph: 'food-sandwich', cat: 'meal', price: 5.95, k: 500, d: 'Fried egg, smoked bacon and melted cheddar on a toasted bun. Served warm.', r: 4.6, c: 1840, al: 'Wheat',
    ing: [['Egg', 'Egg', 1], ['Smoked bacon', '', 1], ['Cheddar', 'Milk', 1], ['Butter on the bun', 'Milk', 1]], adds: [['Avocado spread', 1.25, ''], ['Extra cheese', .75, 'Milk'], ['Extra egg', 1.25, 'Egg'], ['Gluten-free bun', 1, '-Wheat']],
    rv: [['Tyler', 5, 'Hot, filling and quick. My morning routine.'], ['Aisha', 4, 'I get it without bacon and with avocado. Great.']] },
  { id: 'egg-bagel', n: 'Egg & Cheese Bagel', ph: 'food-egg-bagel', cat: 'meal', price: 6.45, k: 520, d: 'Scrambled egg, cheddar and tomato on a toasted bagel.', r: 4.5, c: 610, al: 'Wheat',
    ing: [['Scrambled egg', 'Egg', 1], ['Cheddar', 'Milk', 1], ['Tomato', '', 1]], adds: [['Bacon', 1.5, ''], ['Avocado spread', 1.25, ''], ['Gluten-free bagel', 1, '-Wheat']],
    rv: [['Diego', 5, 'Big and tasty, keeps me full until lunch.'], ['Hannah', 4, 'Add bacon. You will not regret it.']] },
  { id: 'panini', n: 'Ham & Swiss Panini', ph: 'food-panini', cat: 'meal', price: 7.25, k: 470, d: 'Smoked ham and Swiss cheese pressed in toasted bread with Dijon mustard.', r: 4.4, c: 520, al: 'Wheat',
    ing: [['Smoked ham', '', 1], ['Swiss cheese', 'Milk', 1], ['Dijon mustard', 'Mustard', 1]], adds: [['Extra cheese', .75, 'Milk'], ['Tomato', .5, '']],
    rv: [['Peter', 4, 'Crispy and melty, exactly what I wanted.'], ['Laura', 5, 'Ask for it without mustard if you do not like it, they do it.']] },
  { id: 'bagel', n: 'Bagel & Cream Cheese', ph: 'food-bagel', cat: 'meal', price: 3.25, k: 380, d: 'Toasted plain bagel with a generous layer of cream cheese.', r: 4.3, c: 470, al: 'Wheat',
    ing: [['Cream cheese', 'Milk', 1]], adds: [['Smoked salmon', 2.5, 'Fish'], ['Avocado spread', 1.25, ''], ['Toasted', 0, '']],
    rv: [['Ruth', 4, 'Simple and good. Add salmon to make it a meal.'], ['Kai', 4, 'Always fresh.']] }
];
const P = Object.fromEntries(LIST.map(p => [p.id, p]));
LIST.forEach(p => {
  p.sizes = typeof p.price === 'object';
  p.adds = p.adds || []; p.ing = p.ing || [];
  const t = new Set(p.tags || []);
  if (p.hol) t.add('festive');
  if (p.temp === 'iced') t.add('cold');
  // can it be made without dairy? (dairy-free milk available and every dairy part can be left out)
  if (p.cat === 'drink' && !/Milk/.test(p.al || '') && p.ing.every(i => !/Milk/.test(i[1]) || i[2])) t.add('dairyfree');
  p.tag = t;
});
const BUILD = [
  ['caramel-macchiato', { mode: 'hot', dot: '#c58a4a' }],
  ['latte', { mode: 'hot', dot: '#d9b48a' }],
  ['peppermint-mocha', { mode: 'hot', dot: '#c8102e', red: 1 }],
  ['gingerbread-latte', { mode: 'hot', dot: '#a0522d', red: 1 }],
  ['matcha', { mode: 'iced', dot: '#8db35a', low: '#f1eee2', up: '#7fae4c', split: .45, label: 'Iced Matcha Latte' }],
  ['cold-brew', { mode: 'iced', dot: '#3a2416', low: '#4a2a16', up: '#2b170b', split: .7 }]
];
const BM = Object.fromEntries(BUILD);

// ---------- state (only in this browser) ----------
let acct = S.get('acct', null), saved = S.get('saved', null), stars = S.get('stars', 0), bag = S.get('bag', []), userRev = S.get('rev', {}), orders = S.get('orders', []), claimed = S.get('claimed', {});
const save = () => { S.set('acct', acct); S.set('saved', saved); S.set('stars', stars); S.set('bag', bag); S.set('rev', userRev); S.set('orders', orders); S.set('claimed', claimed); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const isBirthday = () => { if (!acct || !acct.bm) return false; const d = new Date(); return d.getMonth() + 1 === +acct.bm && d.getDate() === +acct.bd; };

// ---------- photos (Wikimedia Commons and Flickr via Openverse, credited) ----------
const PH = '/proiecte/starbucks/photos/';
let credits = {};
const has = id => !!credits[id];
const imgTag = (id, sizes, cls = '', alt = '') => `<img${cls ? ` class="${cls}"` : ''} src="${PH}${id}-1920.webp" srcset="${PH}${id}-960.webp 960w, ${PH}${id}-1920.webp 1920w, ${PH}${id}-3840.webp 3840w" sizes="${sizes}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
const who = id => credits[id] ? `Photo: ${credits[id].artist || 'Unknown'}, ${credits[id].license}` : '';
const title = id => credits[id] ? credits[id].title.replace(/\.(jpe?g|png|tiff?)$/i, '').replace(/\s*\(\d+\)$/, '') : '';

// ---------- ratings ----------
function rating(p) {
  const mine = userRev[p.id] || [];
  const n = p.c + mine.length, sum = p.r * p.c + mine.reduce((a, r) => a + r.s, 0);
  return { avg: sum / n, n };
}
const starsHTML = (v, size) => `<span class="st"${size ? ` style="font-size:${size}px"` : ''} aria-label="${v.toFixed(1)} out of 5 stars">★★★★★<i style="width:${(v / 5 * 100).toFixed(1)}%">★★★★★</i></span>`;
const rateHTML = p => { const r = rating(p); return `<div class="rate">${starsHTML(r.avg)}<b>${r.avg.toFixed(1)}</b><span>(${r.n.toLocaleString('en-US')})</span></div>`; };
const fromPrice = p => p.sizes ? 'from ' + money(p.price.tall) : money(p.price);
function bestQuote(p) {
  const mine = (userRev[p.id] || []).filter(r => r.s >= 4 && r.t);
  if (mine.length) { const r = mine[mine.length - 1]; return [r.n, r.t]; }
  const s = p.rv.find(r => r[1] === 5) || p.rv[0]; return [s[0], s[2]];
}

// ---------- render menu sections ----------
function cardHTML(p) {
  const r = rating(p), q = bestQuote(p);
  const badge = p.hol ? '<span class="badge red">Holiday</span>' : r.avg >= 4.65 && p.c > 1500 ? '<span class="badge">Customer favorite</span>' : '';
  return `<article class="card" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(p.n)}, ${fromPrice(p)}, rated ${r.avg.toFixed(1)}">
    <div class="ph">${imgTag(p.ph, '300px', '', p.n)}${badge}<span class="credit">${who(p.ph)}</span></div>
    <h3>${esc(p.n)}</h3>${rateHTML(p)}<p>${esc(p.d)}</p>
    <q>“${esc(q[1])}”<cite>${esc(q[0])}</cite></q>
    <div class="row"><span>${fromPrice(p)}</span><button class="add" data-open="${p.id}" aria-label="Customize and add ${esc(p.n)}">+</button></div></article>`;
}
function renderHoliday() {
  const f = P['peppermint-mocha'];
  const fe = $('#hfeat');
  if (has(f.ph)) {
    const r = rating(f), q = bestQuote(f);
    fe.dataset.id = f.id;
    fe.innerHTML = `${imgTag(f.ph, '(max-width: 1000px) 100vw, 640px', '', f.n)}<span class="credit">${who(f.ph)}</span>
      <div class="in"><span class="tag">Most loved this season</span><h3>${esc(f.n)}</h3>
      <div class="rate">${starsHTML(r.avg, 16)}<b>${r.avg.toFixed(1)}</b><span>${r.n.toLocaleString('en-US')} reviews</span></div>
      <q>“${esc(q[1])}” <small style="font-family:var(--sans);font-style:normal;font-size:13px;opacity:.8">— ${esc(q[0])}</small></q>
      <div class="btns"><button class="pill light" data-open="${f.id}" type="button">Customize · ${fromPrice(f)}</button><button class="pill ghost" style="color:#fff;box-shadow:inset 0 0 0 1.5px #fff" data-try="${f.id}" type="button">See it in the red cup</button></div></div>`;
  } else fe.remove();
  $('#hlist').innerHTML = LIST.filter(p => p.hol && p.id !== f.id && has(p.ph)).map(p => { const r = rating(p); return `<button class="hitem" data-id="${p.id}" type="button">${imgTag(p.ph, '(max-width: 560px) 50vw, 300px', '', p.n)}<span class="in"><b>${esc(p.n)}</b>${starsHTML(r.avg)} <span class="p">${r.avg.toFixed(1)} · ${fromPrice(p)}</span></span></button>`; }).join('');
}
let mood = 'all';
function renderRail() {
  const drinks = LIST.filter(p => p.cat === 'drink' && has(p.ph));
  const match = drinks.filter(p => mood === 'all' || p.tag.has(mood)).sort((a, b) => rating(b).avg - rating(a).avg || b.c - a.c);
  $('#rail').innerHTML = match.map(cardHTML).join('');
  $('#rail').scrollLeft = 0;
  const top = match[0];
  if (top) {
    const q = bestQuote(top), r = rating(top);
    $('#pick').innerHTML = `${imgTag(top.ph, '84px', '', top.n)}<div class="t"><small>${mood === 'all' ? 'Top rated right now' : 'Our pick for you'}</small><b>${esc(top.n)} · ${r.avg.toFixed(1)} ★</b><q>“${esc(q[1])}” — ${esc(q[0])}</q></div><button class="pill" data-open="${top.id}" type="button">Order</button>`;
    $('#pick').dataset.id = top.id; $('#pick').style.display = '';
  } else $('#pick').style.display = 'none';
  bindCardTilt();
}
function tileHTML(p, extra = '') {
  const r = rating(p);
  return `<div class="tile mask ${p.big ? 'big' : p.wide ? 'wide' : ''}" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(p.n)}, ${fromPrice(p)}" ${extra}>${imgTag(p.ph, p.big ? '(max-width: 1000px) 100vw, 640px' : '(max-width: 1000px) 50vw, 320px', '', p.n)}<div class="shine"></div>${p.hol ? '<span class="badge red">Holiday</span>' : ''}
    <span class="credit">${who(p.ph)}</span><div class="lab"><div><b>${esc(p.n)}</b>${starsHTML(r.avg)} <span>${r.avg.toFixed(1)} · ${fromPrice(p)}</span></div><button class="add" data-open="${p.id}" aria-label="Customize and add ${esc(p.n)}">+</button></div></div>`;
}
function renderFood() {
  const bak = LIST.filter(p => p.cat === 'bakery' && has(p.ph));
  let html = bak.map(p => tileHTML(p)).join('');
  if (has('food-bakery-case')) html += `<div class="tile wide mask" data-full="${PH}food-bakery-case-3840.webp" data-cap="The bakery counter · ${esc(who('food-bakery-case'))}">${imgTag('food-bakery-case', '(max-width: 1000px) 100vw, 640px', '', 'The bakery counter')}<div class="shine"></div><span class="credit">${who('food-bakery-case')}</span><div class="lab"><div><b>The bakery counter</b><span>Restocked every morning</span></div></div></div>`;
  $('#bento').innerHTML = html;
  $('#meals').innerHTML = LIST.filter(p => p.cat === 'meal' && has(p.ph)).map(cardHTML).join('');
  bindTiles(); observeReveals();
}
function renderAllMenus() { renderHoliday(); renderRail(); renderFood(); }

$('#moods').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#moods button').forEach(x => x.setAttribute('aria-pressed', x === b)); mood = b.dataset.m; renderRail(); });

// open product from anywhere
document.addEventListener('click', e => {
  if (railMoved) return;
  const t = e.target.closest('[data-try]'); if (t) { selectDrink(t.dataset.try); scrollToEl($('#order')); return; }
  const o = e.target.closest('[data-open], .card[data-id], .tile[data-id], .hitem[data-id], .hfeat[data-id], .pick[data-id]');
  if (o && !e.target.closest('#pm')) { const id = o.dataset.open || o.dataset.id; if (P[id]) openProduct(id); }
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card[data-id], .tile[data-id]')) { e.preventDefault(); openProduct(e.target.dataset.id); } });

// ---------- overlays ----------
const openStack = [];
function openOv(el) { el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); if (!openStack.includes(el)) openStack.push(el); lenis?.stop(); document.documentElement.style.overflow = 'hidden'; setTimeout(() => el.querySelector('.x, button')?.focus({ preventScroll: true }), 60); }
function closeOv(el) { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); const i = openStack.indexOf(el); if (i >= 0) openStack.splice(i, 1); if (!openStack.length) { lenis?.start(); document.documentElement.style.overflow = ''; } }
addEventListener('keydown', e => { if (e.key === 'Escape' && openStack.length) closeOv(openStack[openStack.length - 1]); });
$$('.ov').forEach(o => o.addEventListener('click', e => { if (e.target === o || e.target.closest('[data-close]')) closeOv(o); }));
$('#bag').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeOv($('#bag')); });
document.addEventListener('pointerdown', e => { const b = $('#bag'); if (b.classList.contains('open') && !b.contains(e.target) && !e.target.closest('#bagBtn, .ov.open, .toast')) closeOv(b); });

// ---------- product: customize, allergens, reviews ----------
let pm = null;
function unit(s) {
  const p = s.p; let v = p.sizes ? p.price[s.size] : p.price;
  if (s.milk) v += (MILK.find(m => m[0] === s.milk) || [0, 0])[1];
  s.adds.forEach(a => { const o = p.adds.find(x => x[0] === a); if (o) v += o[1]; });
  return v;
}
function allergens(s) {
  const p = s.p, set = new Set((p.al || '').split(',').filter(Boolean)), minus = new Set();
  if (s.milk) { const m = MILK.find(x => x[0] === s.milk); if (m && m[2]) set.add(m[2]); }
  p.ing.forEach(i => { if (!s.rm.has(i[0])) i[1].split(',').filter(Boolean).forEach(a => set.add(a)); });
  p.adds.forEach(a => { if (s.adds.has(a[0])) a[2].split(',').filter(Boolean).forEach(x => x[0] === '-' ? minus.add(x.slice(1)) : set.add(x)); });
  minus.forEach(m => set.delete(m));
  return [...set];
}
function openProduct(id, o = {}) {
  const p = P[id]; if (!p) return;
  pm = { p, size: p.sizes ? (o.size || 'grande') : null, milk: p.milk ? (o.milk || p.milkDef || '2% milk') : null, adds: new Set(), rm: new Set(), qty: 1, cup: o.cup ?? (cupName || acct?.name || ''), star: 0 };
  const r = rating(p);
  const kick = [p.hol ? 'Holiday' : '', p.cat === 'drink' ? (p.temp === 'iced' ? 'Cold drink' : 'Hot drink') : p.cat === 'meal' ? 'Breakfast & lunch' : 'Bakery'].filter(Boolean).join(' · ');
  $('#pmBox').innerHTML = `<button class="x" data-close aria-label="Close">×</button>
  <div class="pmimg">${has(p.ph) ? imgTag(p.ph, '(max-width: 1000px) 100vw, 540px', '', p.n) : ''}${p.hol ? '<span class="badge red">Holiday</span>' : ''}<span class="credit">${who(p.ph)}</span></div>
  <div class="pmbody">
    <div class="kicker">${kick}</div><h2 id="pmTitle">${esc(p.n)}</h2>
    <div class="rate">${starsHTML(r.avg, 16)}<b>${r.avg.toFixed(1)}</b><span>${r.n.toLocaleString('en-US')} reviews</span> · <button class="linkbtn" data-jump>Read reviews</button></div>
    <p class="desc">${esc(p.d)}</p>
    <div class="alg"><span id="pmKcal"></span> · Contains: <b id="pmAl"></b></div>
    ${p.sizes ? `<div class="opt"><h4>Size</h4><div class="chips" data-g="size">${['tall', 'grande', 'venti'].map(s => `<button data-size="${s}" aria-pressed="${s === pm.size}">${s[0].toUpperCase() + s.slice(1)} <em>${money(p.price[s])}</em></button>`).join('')}</div></div>` : ''}
    ${p.milk ? `<div class="opt"><h4>Milk <small>· oat, coconut, almond and soy are dairy-free</small></h4><div class="chips" data-g="milk">${MILK.map(m => `<button data-milk="${m[0]}" aria-pressed="${m[0] === pm.milk}">${m[0]}${m[1] ? ` <em>+${money(m[1])}</em>` : ''}</button>`).join('')}</div></div>` : ''}
    ${p.adds.length ? `<div class="opt"><h4>Add extra</h4><div class="chips" data-g="add">${p.adds.map(a => `<button data-add="${esc(a[0])}" aria-pressed="false">${esc(a[0])}${a[1] ? ` <em>+${money(a[1])}</em>` : ''}</button>`).join('')}</div></div>` : ''}
    ${p.ing.some(i => i[2]) ? `<div class="opt"><h4>Leave out <small>· tap anything you do not want or are allergic to</small></h4><div class="chips rm" data-g="rm">${p.ing.filter(i => i[2]).map(i => `<button data-rm="${esc(i[0])}" aria-pressed="false">${esc(i[0])}${i[1] ? `<span class="al">(${esc(i[1].replace(/,/g, ', '))})</span>` : ''}</button>`).join('')}</div></div>` : ''}
    <p class="note">Allergies? The “Contains” line updates as you change your order. Our kitchen also handles nuts, milk, egg, wheat and soy, so ask a barista about cross-contact.</p>
    ${p.cat === 'drink' ? `<label class="opt pmname"><h4>Name on the cup</h4><input id="pmCup" maxlength="40" value="${esc(pm.cup)}" autocomplete="off" spellcheck="false"></label>` : ''}
    <div class="revs" id="pmRevs"></div>
    <div class="buy"><div class="qty"><button data-q="-1" aria-label="One less">−</button><span id="pmQty">1</span><button data-q="1" aria-label="One more">+</button></div><button class="pill" data-buy type="button">Add to bag · <span id="pmPrice"></span></button></div>
  </div>`;
  refreshPM(); renderReviews();
  $('#pmBox .pmbody').scrollTop = 0;
  openOv($('#pm'));
}
function refreshPM() {
  const s = pm, al = allergens(s);
  $('#pmPrice').textContent = money(unit(s) * s.qty);
  $('#pmQty').textContent = s.qty;
  $('#pmKcal').textContent = Math.round(s.p.k * (s.size ? SZ[s.size] : 1)) + ' cal';
  $('#pmAl').innerHTML = al.length ? esc(al.join(', ')) : '<span class="ok">none of the major allergens</span>';
  $$('#pmBox [data-size]').forEach(b => b.setAttribute('aria-pressed', b.dataset.size === s.size));
  $$('#pmBox [data-milk]').forEach(b => b.setAttribute('aria-pressed', b.dataset.milk === s.milk));
  $$('#pmBox [data-add]').forEach(b => b.setAttribute('aria-pressed', s.adds.has(b.dataset.add)));
  $$('#pmBox [data-rm]').forEach(b => b.setAttribute('aria-pressed', s.rm.has(b.dataset.rm)));
}
function renderReviews() {
  const p = pm.p, r = rating(p), mine = (userRev[p.id] || []).slice().reverse();
  // distribution: sample spread around the average, plus your own reviews
  const base = [.02, .03, .08, .25, .62].map((f, i) => f * (1 + (r.avg - 4.6) * (i - 2) * .6));
  const tot = base.reduce((a, b) => a + b, 0), dist = base.map(v => v / tot * p.c);
  mine.forEach(m => dist[m.s - 1]++);
  const bars = [5, 4, 3, 2, 1].map(k => `<div><span>${k} ★</span><i style="--w:${(dist[k - 1] / r.n * 100).toFixed(1)}%"></i><span>${Math.round(dist[k - 1] / r.n * 100)}%</span></div>`).join('');
  const form = acct ? `<div class="wr"><b>Rate the ${esc(p.n)}</b><br><span class="starpick" role="radiogroup" aria-label="Your rating">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-star="${i}" class="${i <= pm.star ? 'on' : ''}" aria-label="${i} star${i > 1 ? 's' : ''}">★</button>`).join('')}</span>
      <textarea id="revText" maxlength="400" placeholder="What did you like? How did you customize it?"></textarea><button class="pill" data-sendrev type="button">Post review as ${esc(acct.name)}</button><div class="err" id="revErr"></div></div>`
    : `<div class="wr"><b>Tried it?</b> Sign in to rate it and help others choose.<br><button class="pill ghost" style="margin-top:10px" data-signin type="button">Sign in to write a review</button></div>`;
  $('#pmRevs').innerHTML = `<h3>Reviews <small>${r.avg.toFixed(1)} out of 5 · ${r.n.toLocaleString('en-US')} ratings</small></h3><div class="bars">${bars}</div>${form}
    ${mine.map(m => `<div class="rv mine"><div class="h"><b>${esc(m.n)} (you)</b><span>${starsHTML(m.s)} · ${esc(m.d)}</span></div>${m.t ? `<p>${esc(m.t)}</p>` : ''}</div>`).join('')}
    <div class="sample">Sample reviews written for this concept.</div>
    ${p.rv.map(v => `<div class="rv"><div class="h"><b>${esc(v[0])}</b><span>${starsHTML(v[1])}</span></div><p>${esc(v[2])}</p></div>`).join('')}`;
}
$('#pmBox').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !pm) return;
  if (b.dataset.size) pm.size = b.dataset.size;
  else if (b.dataset.milk) pm.milk = b.dataset.milk;
  else if (b.dataset.add) { pm.adds.has(b.dataset.add) ? pm.adds.delete(b.dataset.add) : pm.adds.add(b.dataset.add); }
  else if (b.dataset.rm) { pm.rm.has(b.dataset.rm) ? pm.rm.delete(b.dataset.rm) : pm.rm.add(b.dataset.rm); }
  else if (b.dataset.q) pm.qty = Math.max(1, Math.min(9, pm.qty + +b.dataset.q));
  else if (b.dataset.star) { pm.star = +b.dataset.star; $$('#pmRevs [data-star]').forEach(x => x.classList.toggle('on', +x.dataset.star <= pm.star)); return; }
  else if ('jump' in b.dataset) { $('#pmRevs').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  else if ('signin' in b.dataset) { openAccount('join', 'Sign in or join to write reviews.'); return; }
  else if ('sendrev' in b.dataset) {
    if (!pm.star) { $('#revErr').textContent = 'Pick 1 to 5 stars first.'; return; }
    addReview(pm.p.id, pm.star, $('#revText').value.trim()); pm.star = 0; renderReviews(); renderAllMenus(); toast('Thanks! Your review is now on the menu.'); return;
  }
  else if ('buy' in b.dataset) {
    const cup = $('#pmCup') ? $('#pmCup').value.trim() : '';
    addToBag({ id: pm.p.id, size: pm.size, milk: pm.milk, adds: [...pm.adds], rm: [...pm.rm], qty: pm.qty, cup }, b);
    closeOv($('#pm')); return;
  } else return;
  refreshPM();
});
function addReview(id, s, t) {
  (userRev[id] = userRev[id] || []).push({ n: acct.name, s, t: t.slice(0, 400), d: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) });
  save();
}

// ---------- bag ----------
let useReward = null;
const keyOf = it => JSON.stringify([it.id, it.size, it.milk, [...it.adds].sort(), [...it.rm].sort(), it.cup]);
function addToBag(it, fromEl) {
  const k = keyOf(it), ex = bag.find(b => keyOf(b) === k);
  if (ex) ex.qty = Math.min(9, ex.qty + it.qty); else bag.push(it);
  save(); renderBag(); flyToBag(P[it.id], fromEl);
  toast(`${P[it.id].n}${it.cup ? ` for ${it.cup}` : ''} added to your bag`);
}
function flyToBag(p, fromEl) {
  const btn = $('#bagBtn'); btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  if (reduce || !fromEl || !has(p.ph)) return;
  const a = fromEl.getBoundingClientRect(), b = btn.getBoundingClientRect();
  const im = document.createElement('img'); im.src = `${PH}${p.ph}-960.webp`; im.className = 'flystar';
  Object.assign(im.style, { width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', left: (a.left + a.width / 2 - 28) + 'px', top: (a.top + a.height / 2 - 28) + 'px', boxShadow: '0 8px 20px rgba(0,0,0,.25)' });
  document.body.appendChild(im);
  requestAnimationFrame(() => { im.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.3)`; im.style.opacity = '.4'; });
  setTimeout(() => im.remove(), 950);
}
const itemDesc = it => [it.size && it.size[0].toUpperCase() + it.size.slice(1), it.milk && it.milk !== (P[it.id].milkDef || '2% milk') ? it.milk : '', ...it.adds.map(a => '+ ' + a), ...it.rm.map(r => 'no ' + r.toLowerCase()), it.cup ? `name: “${it.cup}”` : ''].filter(Boolean).join(' · ');
const unitOf = it => unit({ p: P[it.id], size: it.size, milk: it.milk, adds: new Set(it.adds) });
function rewardsAvailable() {
  if (!acct) return [];
  const out = [];
  if (claimed.goldGift === 'ready') out.push({ id: 'gold', t: 'Gold welcome gift: a free drink', cls: 'gold' });
  if (isBirthday() && stars >= 30 && claimed.bday !== new Date().getFullYear()) out.push({ id: 'bday', t: 'Happy birthday! Your drink is on us today', cls: '' });
  if (stars >= 50) out.push({ id: 'r50', t: 'Use 50 ★ for a free drink', cls: '' });
  return out;
}
function totals() {
  const sub = bag.reduce((a, it) => a + unitOf(it) * it.qty, 0);
  let disc = 0;
  if (useReward) { const drinks = bag.filter(it => P[it.id].cat === 'drink'); if (drinks.length) disc = Math.max(...drinks.map(unitOf)); }
  const tax = (sub - disc) * .1;
  return { sub, disc, tax, total: sub - disc + tax };
}
function renderBag() {
  const n = bag.reduce((a, it) => a + it.qty, 0);
  $('#bagCount').textContent = n; $('#bagCount').classList.toggle('on', n > 0);
  const body = $('#bagBody'), foot = $('#bagFoot');
  if (!bag.length) { body.innerHTML = `<div class="empty"><b>Your bag is empty</b>Add a holiday drink or a cake pop to get started.</div>`; foot.innerHTML = `<button class="pill" data-close type="button" onclick="document.querySelector('#holiday').scrollIntoView({behavior:'smooth'})">See the holiday menu</button>`; useReward = null; return; }
  const rw = rewardsAvailable();
  if (useReward && !rw.find(r => r.id === useReward)) useReward = null;
  const hasDrink = bag.some(it => P[it.id].cat === 'drink');
  body.innerHTML = bag.map((it, i) => { const p = P[it.id], u = unitOf(it); return `<div class="bi">${has(p.ph) ? `<img src="${PH}${p.ph}-960.webp" alt="">` : '<span></span>'}<div><b>${esc(p.n)}</b><small>${esc(itemDesc(it))}</small><div class="q"><button data-dq="${i}" data-d="-1" aria-label="One less">−</button><span>${it.qty}</span><button data-dq="${i}" data-d="1" aria-label="One more">+</button></div></div><div class="r">${money(u * it.qty)}</div></div>`; }).join('');
  const t = totals();
  const earn = Math.floor((t.sub - t.disc) * 2);
  foot.innerHTML = `${rw.map(r => `<div class="rewardbox ${r.cls}">★ ${esc(r.t)}<br>${hasDrink ? `<button data-rw="${r.id}" class="${useReward === r.id ? 'on' : ''}" type="button">${useReward === r.id ? 'Applied ✓' : 'Apply to the priciest drink'}</button>` : '<small>Add a drink to use it.</small>'}</div>`).join('')}
    <div class="tot"><span>Subtotal</span><span>${money(t.sub)}</span></div>${t.disc ? `<div class="tot" style="color:var(--green)"><span>Reward</span><span>−${money(t.disc)}</span></div>` : ''}<div class="tot"><span>Tax (demo)</span><span>${money(t.tax)}</span></div>
    <div class="tot big"><span>Total</span><span>${money(t.total)}</span></div>
    ${acct ? `<button class="pill" data-checkout type="button">Place order · earn ${earn} ★</button>` : `<button class="pill" data-signin type="button">Sign in to earn ${earn} ★</button><button class="pill ghost" style="width:100%;margin-top:8px" data-checkout type="button">Continue as guest</button>`}
    <div class="sub">Pick-up at Market Square (fictional) · demo, no payment is taken</div>`;
}
$('#bag').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.dq) { const it = bag[+b.dataset.dq]; it.qty += +b.dataset.d; if (it.qty <= 0) bag.splice(+b.dataset.dq, 1); save(); renderBag(); }
  else if (b.dataset.rw) { useReward = useReward === b.dataset.rw ? null : b.dataset.rw; renderBag(); }
  else if ('signin' in b.dataset) { closeOv($('#bag')); openAccount('join', 'Sign in or join to earn stars on this order.'); }
  else if ('checkout' in b.dataset) checkout(b);
});
$('#bagBtn').addEventListener('click', () => { renderBag(); $('#bag').classList.contains('open') ? closeOv($('#bag')) : openOv($('#bag')); });
function checkout(btn) {
  if (!bag.length) return;
  const t = totals(), earn = acct ? Math.floor((t.sub - t.disc) * 2) : 0;
  const items = bag.map(it => ({ ...it }));
  if (useReward === 'r50') stars -= 50;
  if (useReward === 'bday') claimed.bday = new Date().getFullYear();
  if (useReward === 'gold') claimed.goldGift = 'used';
  if (acct) orders.push({ d: Date.now(), items: items.map(i => i.id), total: +t.total.toFixed(2) });
  bag = []; useReward = null; save(); renderBag(); updateStarsUI();
  closeOv($('#bag'));
  showDone(items, earn, t.total);
  if (earn) setTimeout(() => addStars(earn, $('#doneBox .ready') || btn, true), 500);
}
function showDone(items, earn, total) {
  const ids = [...new Set(items.map(i => i.id))];
  const mins = 4 + Math.floor(Math.random() * 5);
  $('#doneBox').innerHTML = `<button class="x" data-close aria-label="Close">×</button><div class="kicker">Order placed · demo</div>
    <div class="big">Thanks${acct ? ', ' + esc(acct.name) : ''}! We are making it now.</div>
    <div class="ready"><b>${mins} min</b><div>Pick it up at <strong>Market Square</strong> (fictional). Total ${money(total)}.${earn ? `<br><strong style="color:var(--green)">+${earn} ★ added to your card</strong>` : acct ? '<br>This one was on us, enjoy your reward.' : '<br>Join next time to earn stars on every order.'}</div></div>
    <h3 style="margin:22px 0 4px;color:var(--house)">How was it? Rate your order</h3><p style="margin:0 0 8px;color:var(--soft);font-size:15px">Your ratings help other people choose.</p>
    ${ids.map(id => { const p = P[id]; return `<div class="rr" data-rid="${id}">${has(p.ph) ? `<img src="${PH}${p.ph}-960.webp" alt="">` : '<span></span>'}<div><b>${esc(p.n)}</b><br><span class="starpick">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-rs="${i}" aria-label="${i} stars">★</button>`).join('')}</span><input maxlength="300" placeholder="Optional: a few words about it"></div></div>`; }).join('')}
    <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">${acct ? '<button class="pill" data-sendall type="button">Send my reviews</button>' : '<button class="pill" data-signin type="button">Sign in to post reviews</button>'}<button class="pill ghost" data-close type="button">Maybe later</button></div><div class="err" id="doneErr"></div>`;
  openOv($('#done'));
}
$('#doneBox').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.rs) { const row = b.closest('.rr'); row.dataset.s = b.dataset.rs; $$('[data-rs]', row).forEach(x => x.classList.toggle('on', +x.dataset.rs <= +b.dataset.rs)); }
  else if ('signin' in b.dataset) openAccount('join', 'Sign in or join to post your reviews.');
  else if ('sendall' in b.dataset) {
    const rows = $$('#doneBox .rr').filter(r => r.dataset.s);
    if (!rows.length) { $('#doneErr').textContent = 'Tap the stars on at least one item.'; return; }
    rows.forEach(r => addReview(r.dataset.rid, +r.dataset.s, $('input', r).value.trim()));
    closeOv($('#done')); renderAllMenus(); toast(`Thanks! ${rows.length} review${rows.length > 1 ? 's' : ''} posted.`);
  }
});

// ---------- stars, member card, tiers ----------
const tierOf = n => n >= 200 ? 'Gold' : 'Green';
function cardInner() {
  const nm = acct ? acct.name : 'Your name';
  return `<div class="top"><img src="img/starbucks-siren.svg" alt=""><span class="tier">${tierOf(stars)} member</span></div>
    <div class="bot"><div class="nm">${esc(nm)}</div><div class="ss"><span>${acct ? 'Member since ' + esc(acct.since) : 'Join to start collecting'}</span><span><b>${stars}</b> ★</span></div></div>`;
}
function renderCards() { $$('.mcard').forEach(c => { c.innerHTML = cardInner(); c.classList.toggle('gold', stars >= 200); }); }
function bindMcardTilt() {
  $$('.mcard').forEach(c => {
    if (c.dataset.tb) return; c.dataset.tb = 1;
    c.addEventListener('pointermove', e => { if (reduce) return; const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.setProperty('--ry', (x * 22) + 'deg'); c.style.setProperty('--rx', (-y * 16) + 'deg'); c.style.setProperty('--sx', (x * 140) + '%'); });
    c.addEventListener('pointerleave', () => { c.style.removeProperty('--ry'); c.style.removeProperty('--rx'); c.style.removeProperty('--sx'); });
  });
}
function updateStarsUI() {
  $('#starCount').textContent = stars;
  $('#starsBox').classList.toggle('goldy', stars >= 200);
  $('#meterBar').style.width = Math.min(100, stars / 200 * 100) + '%';
  $$('#tiers > div').forEach(d => d.classList.toggle('got', stars >= +d.dataset.l));
  $$('.track .mk').forEach((m, i) => m.classList.toggle('on', stars >= [25, 30, 50, 200][i]));
  const ab = $('#acctBtn'); ab.classList.toggle('in', !!acct); ab.classList.toggle('gold', !!acct && stars >= 200);
  $('#avatar').textContent = acct ? acct.name[0].toUpperCase() : '?';
  $('#acctLbl').textContent = acct ? acct.name : 'Sign in';
  $('#joinBtn').textContent = acct ? 'Open my account' : 'Join for free';
  renderCards();
}
function setStars(n) {
  const before = stars; stars = Math.max(0, n);
  if (before < 200 && stars >= 200) {
    if (!claimed.goldGift) claimed.goldGift = 'ready';
    confetti(); setTimeout(() => toast(acct ? `You are Gold, ${acct.name}! A free drink is waiting in your bag.` : 'Gold card unlocked! Join to keep it and claim your free drink.'), 300);
  } else if (before < 50 && stars >= 50) toast('50 stars: you can now get a free drink of your choice.');
  else if (before < 30 && stars >= 30) toast('30 stars: your birthday drink is unlocked.');
  save(); updateStarsUI(); renderBag();
}
function addStars(n, fromEl, silent) {
  const box = $('#starsBox').getBoundingClientRect(), from = (fromEl || $('#starsBox')).getBoundingClientRect();
  const fly = Math.min(n, 12);
  for (let i = 0; i < fly; i++) {
    const s = document.createElement('div'); s.className = 'flystar'; s.textContent = '★';
    s.style.left = (from.left + from.width / 2) + 'px'; s.style.top = (from.top + from.height / 2) + 'px'; document.body.appendChild(s);
    const dx = box.left + 20 - (from.left + from.width / 2), dy = box.top + 14 - (from.top + from.height / 2);
    setTimeout(() => { s.style.transform = `translate(${dx}px, ${dy}px) scale(.6) rotate(${180 + i * 40}deg)`; s.style.opacity = '.2'; }, 30 + i * 60);
    setTimeout(() => s.remove(), 1000 + i * 60);
  }
  setTimeout(() => { setStars(stars + n); const b = $('#starsBox'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }, 950 + fly * 60);
}
function confetti() {
  if (reduce) return;
  const c = $('#confetti'), cols = ['#cba258', '#f4dc98', '#00704a', '#b5121b', '#ffffff'];
  for (let i = 0; i < 90; i++) { const d = document.createElement('i'); d.style.left = Math.random() * 100 + 'vw'; d.style.background = cols[i % cols.length]; d.style.setProperty('--dx', (Math.random() - .5) * 300 + 'px'); d.style.setProperty('--r', Math.random() * 900 + 'deg'); d.style.animationDuration = 1.8 + Math.random() * 1.6 + 's'; d.style.animationDelay = Math.random() * .4 + 's'; c.appendChild(d); setTimeout(() => d.remove(), 4200); }
}
$('#demoStars').addEventListener('click', e => addStars(25, e.currentTarget));
$('#joinBtn').addEventListener('click', () => openAccount(acct ? null : 'join'));
$('#starsBox').addEventListener('click', () => acct ? openAccount() : scrollToEl($('#rewards')));
$('#acctBtn').addEventListener('click', () => openAccount(acct ? null : 'signin'));

// ---------- account page (demo: no password, saved only in this browser) ----------
function openAccount(tab, msg) {
  const box = $('#acBox');
  const head = `<div class="achead"><img src="img/starbucks-siren.svg" alt=""><strong style="color:var(--house);font-size:18px">${acct ? 'Your account' : 'Sign in or join'}</strong><button class="x" data-close aria-label="Close">×</button></div>`;
  const benefits = `<div class="benefits"><h3>Why join</h3><ul>
    <li><i>2★</i><div><b>2 stars for every $1</b><span>On every drink, cake pop and sandwich.</span></div></li>
    <li><i>25</i><div><b>Free customizing at 25 stars</b><span>An extra shot, a syrup or oat milk on us.</span></div></li>
    <li><i>🎂</i><div><b>A birthday drink at 30 stars</b><span>Members with 30 stars or more get a free drink of any size on their birthday.</span></div></li>
    <li><i>50</i><div><b>A free drink at 50 stars</b><span>Any handcrafted drink, any size.</span></div></li>
    <li class="g"><i>★</i><div><b>Gold card at 200 stars</b><span>Your card turns gold and you get a free drink as a welcome gift.</span></div></li></ul></div>`;
  if (!acct) {
    const t = tab || (saved ? 'signin' : 'join');
    const days = Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
    box.innerHTML = `${head}<div class="acgrid"><div class="acform">
      <div class="tabs" role="tablist"><button role="tab" aria-selected="${t === 'join'}" data-tab="join">Join</button><button role="tab" aria-selected="${t === 'signin'}" data-tab="signin">Sign in</button></div>
      ${msg ? `<p style="color:var(--green);font-weight:600">${esc(msg)}</p>` : ''}
      ${t === 'join' ? `<h2>Join Rewards</h2><p>It takes ten seconds. Start earning stars on this order.</p>
        <form id="joinForm" novalidate><label class="inp"><span>First name</span><input name="name" maxlength="24" autocomplete="off" required></label>
        <div class="two"><label class="inp"><span>Birthday month</span><select name="bm"><option value="">Month</option>${MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></label><label class="inp"><span>Day</span><select name="bd"><option value="">Day</option>${days}</select></label></div>
        <label class="inp"><span>Favorite drink (optional)</span><select name="fav"><option value="">Choose later</option>${LIST.filter(p => p.cat === 'drink').map(p => `<option value="${p.id}">${esc(p.n)}</option>`).join('')}</select></label>
        <label class="chk"><input type="checkbox" name="ok" required><span>I agree to the reward terms of this demo.</span></label>
        <div class="err" id="acErr"></div><button class="pill" style="width:100%" type="submit">Create my account</button></form>`
      : `<h2>Welcome back</h2><p>Sign in to see your stars, rewards and reviews.</p>
        ${saved ? `<button class="pill" style="width:100%" data-resume type="button">Continue as ${esc(saved.name)}</button><p style="text-align:center;margin:14px 0 4px;font-size:14px">or</p>` : ''}
        <form id="signForm" novalidate><label class="inp"><span>First name you joined with</span><input name="name" maxlength="24" autocomplete="off"></label><div class="err" id="acErr"></div><button class="pill ${saved ? 'ghost' : ''}" style="width:100%" type="submit">Sign in</button></form>`}
      <div class="demo">Demo account for this portfolio concept: there is no password, nothing is sent anywhere, and it is saved only in this browser.</div>
    </div><div><div class="cardwrap"><div class="mcard"></div></div>${benefits}</div></div>`;
  } else {
    const bd = acct.bm ? `${MONTHS[acct.bm - 1]} ${acct.bd}` : 'not set';
    const bdNote = isBirthday() ? (stars >= 30 ? (claimed.bday === new Date().getFullYear() ? 'Happy birthday! You already enjoyed your free drink today.' : 'Happy birthday! Your free drink is ready, apply it in your bag.') : `Happy birthday! Collect ${30 - stars} more stars to unlock the birthday drink next year.`)
      : stars >= 30 ? `Your birthday drink is unlocked for ${bd}.` : `Collect ${30 - stars} more stars to unlock your free birthday drink (${bd}).`;
    const myRevs = Object.entries(userRev).flatMap(([id, a]) => a.filter(r => r.n === acct.name).map(r => ({ id, ...r })));
    const rw = rewardsAvailable();
    box.innerHTML = `${head}<div class="acgrid"><div>
      <div class="kicker">${tierOf(stars)} member</div><h2 class="big" style="margin-top:6px">Hi, ${esc(acct.name)}.</h2>
      <div class="cardwrap" style="justify-items:start"><div class="mcard"></div></div>
      <div class="mystats"><div><b>${stars}</b><span>stars</span></div><div><b>${orders.length}</b><span>orders</span></div><div><b>${myRevs.length}</b><span>reviews</span></div></div>
      <div class="bday">🎂 <b>Birthday:</b> ${esc(bd)}. ${esc(bdNote)}</div>
      ${stars < 200 ? `<p style="color:var(--soft)">${200 - stars} more stars until your card turns <b style="color:#8a6d2f">Gold</b>.</p>` : '<p style="color:#8a6d2f;font-weight:600">Your card is Gold. Thank you for being a regular!</p>'}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="pill" data-demo type="button">Add 25 demo stars</button><button class="pill ghost" data-out type="button">Sign out</button></div>
    </div><div class="acform">
      <h2 style="font-size:24px">Rewards ready</h2>${rw.length ? rw.map(r => `<div class="rewardbox ${r.cls}">★ ${esc(r.t)}<br><small>Apply it in your bag at checkout.</small></div>`).join('') : '<p>No rewards yet. Order a few drinks, or add demo stars.</p>'}
      <h2 style="font-size:24px;margin-top:24px">Your reviews</h2>${myRevs.length ? myRevs.map(r => `<div class="rv"><div class="h"><b>${esc(P[r.id]?.n || r.id)}</b><span>${starsHTML(r.s)} · ${esc(r.d)}</span></div>${r.t ? `<p>${esc(r.t)}</p>` : ''}</div>`).join('') : '<p>You have not reviewed anything yet. Open any drink or cake and tell people what you think.</p>'}
      <h2 style="font-size:24px;margin-top:24px">Recent orders</h2>${orders.length ? orders.slice(-5).reverse().map(o => `<div class="rv"><div class="h"><b>${o.items.map(i => esc(P[i]?.n || i)).join(', ')}</b><span>${money(o.total)}</span></div><p style="font-size:13px;color:var(--soft)">${new Date(o.d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p></div>`).join('') : '<p>No orders yet.</p>'}
    </div></div>`;
  }
  renderCards(); bindMcardTilt();
  if (!$('#acct').classList.contains('open')) openOv($('#acct'));
  $('#acBox').scrollTop = 0;
}
$('#acBox').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.tab) openAccount(b.dataset.tab);
  else if ('resume' in b.dataset) signIn(saved);
  else if ('out' in b.dataset) { saved = acct; acct = null; save(); updateStarsUI(); renderBag(); closeOv($('#acct')); toast('Signed out. See you soon!'); }
  else if ('demo' in b.dataset) { addStars(25, b); setTimeout(() => openAccount(), 1900); }
});
$('#acBox').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target, fd = new FormData(f), name = String(fd.get('name') || '').trim().replace(/\s+/g, ' ');
  if (f.id === 'joinForm') {
    if (!name) return void ($('#acErr').textContent = 'Please write your first name.');
    if (!fd.get('bm') || !fd.get('bd')) return void ($('#acErr').textContent = 'Add your birthday so we can send you a free drink.');
    if (!fd.get('ok')) return void ($('#acErr').textContent = 'Please accept the demo terms.');
    signIn({ name, bm: +fd.get('bm'), bd: +fd.get('bd'), fav: fd.get('fav') || '', since: new Date().getFullYear() }, true);
  } else {
    if (saved && name.toLowerCase() === saved.name.toLowerCase()) signIn(saved);
    else $('#acErr').textContent = name ? 'We could not find that name in this browser. Join instead, it takes ten seconds.' : 'Write the first name you joined with.';
  }
});
function signIn(a, isNew) {
  acct = a; saved = a; save(); updateStarsUI(); renderBag();
  if (isNew) { setName(a.name); }
  closeOv($('#acct'));
  if (pm && $('#pm').classList.contains('open')) renderReviews();
  const ds = $('#doneBox [data-signin]'); if (ds) { const nb = document.createElement('button'); nb.className = 'pill'; nb.type = 'button'; nb.textContent = 'Send my reviews'; nb.dataset.sendall = ''; ds.replaceWith(nb); }
  toast(isNew ? `Welcome, ${a.name}! You are now earning stars.` : `Welcome back, ${a.name}!`);
  if (isNew) setTimeout(() => addStars(10, $('#starsBox')), 600);
}

// ---------- toast ----------
const toastEl = $('#toast');
function toast(m) { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toastEl.t); toastEl.t = setTimeout(() => toastEl.classList.remove('show'), 2800); }

// ---------- lightbox ----------
const lb = $('#lb'), lbImg = lb.querySelector('img'), lbCap = lb.querySelector('p'), lbClose = lb.querySelector('button');
let lbLast = null, lbSet = [], lbI = 0;
function lbShow() { lbImg.src = lbSet[lbI][0]; lbCap.textContent = lbSet[lbI][1] + (lbSet.length > 1 ? `  ·  ${lbI + 1}/${lbSet.length} (click the photo for the next one)` : ''); }
function bindLightbox() {
  $$('[data-full]').forEach(f => {
    if (f.dataset.lbBound) return; f.dataset.lbBound = 1;
    if (!f.matches('button')) { f.tabIndex = 0; f.setAttribute('role', 'button'); }
    const open = () => { lbLast = f; lbSet = [[f.dataset.full, f.dataset.cap]]; if (f.dataset.full2) lbSet.push([f.dataset.full2, f.dataset.cap2]); lbI = 0; lbShow(); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); lenis?.stop(); lbClose.focus(); };
    f.addEventListener('click', open); f.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !f.matches('button')) { e.preventDefault(); open(); } });
  });
}
lbImg.addEventListener('click', () => { if (lbSet.length > 1) { lbI = (lbI + 1) % lbSet.length; lbShow(); } });
const lbShut = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); if (!openStack.length) lenis?.start(); lbLast?.focus(); };
lbClose.addEventListener('click', lbShut); lb.addEventListener('click', e => { if (e.target === lb) lbShut(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('open')) lbShut(); });

// ---------- load photo credits, then build everything that shows a photo ----------
fetch(PH + 'credits.json').then(r => r.json()).then(c => {
  credits = c;
  renderAllMenus();
  $$('.room[data-ph]').forEach(el => { const id = el.dataset.ph; if (!c[id]) { el.remove(); return; } el.innerHTML = imgTag(id, '(max-width: 1000px) 84vw, 70vw', '', el.dataset.t + ', ' + el.dataset.s) + `<figcaption><div><b>${el.dataset.t}</b><span>${el.dataset.s}</span></div><span class="credit">${who(id)}</span></figcaption>`; el.dataset.full = PH + id + '-3840.webp'; el.dataset.cap = el.dataset.t + ' · ' + who(id); });
  $$('.loc').forEach(el => { const a = el.dataset.out, b = el.dataset.in, nm = el.querySelector('b').textContent; if (!c[a]) { el.remove(); return; } el.insertAdjacentHTML('afterbegin', imgTag(a, '(max-width: 1000px) 50vw, 33vw', 'out', nm) + (c[b] ? imgTag(b, '(max-width: 1000px) 50vw, 33vw', 'in', nm + ', inside') : '')); el.dataset.full = PH + a + '-3840.webp'; el.dataset.full2 = c[b] ? PH + b + '-3840.webp' : ''; el.dataset.cap = nm + ' · ' + who(a); el.dataset.cap2 = c[b] ? nm + ', inside · ' + who(b) : ''; if (!c[b]) el.querySelector('.peek').textContent = 'See photo'; });
  if (c['store-shanghai-roaster']) { $('#jbg').style.backgroundImage = `url(${PH}store-shanghai-roaster-1920.webp)`; $('#jcredit').textContent = who('store-shanghai-roaster'); }
  $('#itotal').textContent = String($$('.room').length).padStart(2, '0');
  $('#credits').innerHTML = Object.keys(c).sort().map(id => `<li><a href="${esc(c[id].page)}" rel="noopener" style="color:#fff">${esc(title(id))}</a>, ${esc(c[id].artist || 'Unknown')}, ${esc(c[id].license)}</li>`).join('');
  fitInside(); bindLightbox();
}).catch(e => console.error('photos', e));

// ---------- 3D cup ----------
const canvas = $('#cup3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
new RGBELoader().load('/lib/hdr/studio.hdr', t => { t.mapping = THREE.EquirectangularReflectionMapping; scene.environment = pmrem.fromEquirectangular(t).texture; t.dispose(); });
scene.environmentIntensity = .9;
const camera = new THREE.PerspectiveCamera(28, 1, .1, 50);
camera.position.set(0, 1.1, 6.4); camera.lookAt(0, .82, 0);
const key = new THREE.DirectionalLight('#fff', 1.4); key.position.set(3, 5, 4); scene.add(key);
scene.add(new THREE.AmbientLight('#ffffff', .25));
const shTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(20,45,38,.45)'); gr.addColorStop(1, 'rgba(20,45,38,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
const shadowM = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
shadowM.rotation.x = -Math.PI / 2; shadowM.position.y = -.07; scene.add(shadowM);
const cup = new THREE.Group(); scene.add(cup);
const H = 1.6;
const prof = (r0, r1, h, n = 24) => { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector2(r0 + (r1 - r0) * t, h * t)); } return pts; };

// cup print: background, siren, order boxes and the handwritten name (auto-fits any length)
const TW = 4096, TH = 2048;
const mk = () => { const c = document.createElement('canvas'); c.width = TW; c.height = TH; return c; };
const nameCanvas = mk(), iceCanvas = mk();
const nameTex = new THREE.CanvasTexture(nameCanvas); nameTex.colorSpace = THREE.SRGBColorSpace; nameTex.anisotropy = 8;
const iceTex = new THREE.CanvasTexture(iceCanvas); iceTex.colorSpace = THREE.SRGBColorSpace; iceTex.anisotropy = 8;
const siren = new Image(); siren.src = 'img/starbucks-siren.svg';
// backgrounds are painted once, so redrawing the name never flickers
const bgPaper = mk(), bgRed = mk();
(() => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const g = bgPaper.getContext('2d'); g.fillStyle = '#fbfaf7'; g.fillRect(0, 0, TW, TH);
  g.globalAlpha = .035; for (let i = 0; i < 900; i++) { g.fillStyle = i % 2 ? '#7a6a55' : '#ffffff'; g.fillRect(rnd() * TW, rnd() * TH, 2 + rnd() * 6, 1); } g.globalAlpha = 1;
  const r = bgRed.getContext('2d'); const gr = r.createLinearGradient(0, 0, 0, TH); gr.addColorStop(0, '#c8161f'); gr.addColorStop(1, '#9e0f17'); r.fillStyle = gr; r.fillRect(0, 0, TW, TH);
  const flake = (x, y, s, a) => { r.save(); r.translate(x, y); r.globalAlpha = a; r.strokeStyle = '#fff'; r.lineWidth = s * .09; r.lineCap = 'round'; for (let k = 0; k < 6; k++) { r.rotate(Math.PI / 3); r.beginPath(); r.moveTo(0, 0); r.lineTo(0, s); r.moveTo(0, s * .55); r.lineTo(s * .22, s * .75); r.moveTo(0, s * .55); r.lineTo(-s * .22, s * .75); r.stroke(); } r.restore(); };
  for (let i = 0; i < 70; i++) { const x = rnd() * TW, y = rnd() * TH, nearName = y > TH * .66 && Math.abs(((x - TW / 2 + TW * 1.5) % TW) - TW / 2) < 800, nearSiren = y < TH * .45 && Math.abs(x - TW / 2) < 450; if (nearName || nearSiren) continue; flake(x, y, 40 + rnd() * 70, .3 + rnd() * .5); }
  r.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 260; i++) { const x = rnd() * TW, y = rnd() * TH; r.beginPath(); r.arc(x, y, 3 + rnd() * 7, 0, 7); r.fill(); }
  r.fillStyle = 'rgba(255,255,255,.9)'; r.fillRect(0, TH * .025, TW, 10); r.fillRect(0, TH * .975, TW, 10);
})();
let cupName = 'Alex', editing = false, caretOn = true;
const NAME_Y = .835, MAX_W = 1120;
function fitName(g, name) {
  const font = s => `600 ${s}px Caveat, "Segoe Print", cursive`;
  let s = 300, lines = [name];
  g.font = font(s);
  while (g.measureText(name).width > MAX_W && s > 150) { s -= 6; g.font = font(s); }
  if (g.measureText(name).width > MAX_W) {
    const words = name.split(/\s+/);
    if (words.length > 1) { let best = null; for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '); const w = Math.max(g.measureText(a).width, g.measureText(b).width); if (!best || w < best.w) best = { w, l: [a, b] }; } lines = best.l; }
    else { const m = Math.ceil(name.length / 2); lines = [name.slice(0, m) + '-', name.slice(m)]; }
    s = 210; g.font = font(s);
    const wide = () => Math.max(...lines.map(l => g.measureText(l).width));
    while (wide() > MAX_W && s > 50) { s -= 4; g.font = font(s); }
  }
  return { s, lines, font: font(s) };
}
function drawName(g, ink) {
  const shown = cupName || (editing ? '' : '…');
  const f = fitName(g, shown || 'M');
  g.save(); g.translate(TW / 2, TH * NAME_Y); g.rotate(-.05);
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = f.font;
  const lh = f.s * .92, y0 = -(f.lines.length - 1) * lh / 2;
  if (shown) f.lines.forEach((l, i) => g.fillText(l, 0, y0 + i * lh));
  const wMax = shown ? Math.max(...f.lines.map(l => g.measureText(l).width)) : 300;
  g.lineWidth = Math.max(6, f.s * .045); g.strokeStyle = ink; g.lineCap = 'round';
  const uy = y0 + (f.lines.length - 1) * lh + f.s * .42;
  g.beginPath(); g.moveTo(-wMax / 2, uy); g.quadraticCurveTo(0, uy + f.s * .1, wMax / 2 + 30, uy - f.s * .08); g.stroke();
  if (editing && caretOn) { const last = shown ? f.lines[f.lines.length - 1] : ''; const lw = g.measureText(last).width; const cy = y0 + (f.lines.length - 1) * lh; g.fillStyle = ink === '#ffffff' ? '#ffd9a0' : '#00704a'; g.fillRect(lw / 2 + 14, cy - f.s * .38, Math.max(6, f.s * .03), f.s * .72); }
  g.restore();
}
function drawCup() {
  const red = BM[drink]?.red, g = nameCanvas.getContext('2d'), cx = TW / 2;
  g.drawImage(red ? bgRed : bgPaper, 0, 0);
  if (siren.complete && siren.naturalWidth) {
    if (red) { g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, TH * .19, 330, 0, 7); g.fill(); }
    g.drawImage(siren, cx - 300, TH * .19 - 300, 600, 600);
  }
  const ink = red ? '#ffffff' : '#2b2b2b';
  g.textBaseline = 'middle'; g.strokeStyle = ink; g.lineWidth = 7; g.font = '500 66px Jost, sans-serif'; g.fillStyle = ink; g.textAlign = 'left';
  ['Decaf', 'Shots', 'Syrup', 'Milk'].forEach((t, i) => { const y = TH * .05 + i * 132, x = cx - 1120; g.strokeRect(x, y, 90, 90); g.fillText(t, x + 120, y + 50); });
  g.strokeStyle = red ? '#ffd9a0' : '#1f6b4b'; g.lineWidth = 16; g.lineCap = 'round';
  const tick = (x, y) => { g.beginPath(); g.moveTo(x + 16, y + 50); g.lineTo(x + 40, y + 78); g.lineTo(x + 88, y + 8); g.stroke(); };
  tick(cx - 1120, TH * .05 + 132); tick(cx - 1120, TH * .05 + 264 + (red ? 0 : 132));
  drawName(g, red ? '#ffffff' : '#1b1b1b');
  nameTex.needsUpdate = true;
  const h = iceCanvas.getContext('2d'); h.clearRect(0, 0, TW, TH);
  if (siren.complete && siren.naturalWidth) h.drawImage(siren, cx - 260, TH * .3 - 260, 520, 520);
  drawName(h, '#111');
  iceTex.needsUpdate = true;
}
let drink = 'caramel-macchiato';
siren.onload = drawCup;
document.fonts.load('600 40px Caveat').then(drawCup).catch(() => {});
document.fonts.ready.then(drawCup);

const hot = new THREE.Group(); cup.add(hot);
nameTex.wrapS = THREE.RepeatWrapping; nameTex.offset.x = .5;
const paper = new THREE.Mesh(new THREE.LatheGeometry(prof(.42, .56, H), 128), new THREE.MeshPhysicalMaterial({ map: nameTex, roughness: .55, clearcoat: .25, clearcoatRoughness: .5, side: THREE.DoubleSide }));
hot.add(paper);
const bottom = new THREE.Mesh(new THREE.CircleGeometry(.42, 64), new THREE.MeshStandardMaterial({ color: '#eceae4', roughness: .7 })); bottom.rotation.x = Math.PI / 2; hot.add(bottom);
const sleeveGeo = new THREE.LatheGeometry(prof(.42 + .14 * .3 + .012, .42 + .14 * .62 + .012, H * .32, 8).map(v => new THREE.Vector2(v.x, v.y + H * .3)), 128);
const kraft = (() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#b48a5e'; g.fillRect(0, 0, 1024, 256); for (let i = 0; i < 256; i += 6) { g.fillStyle = `rgba(80,50,20,${.05 + Math.random() * .06})`; g.fillRect(0, i, 1024, 3); } for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(60,35,10,${Math.random() * .12})`; g.fillRect(Math.random() * 1024, Math.random() * 256, 2, 2); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const sleeve = new THREE.Mesh(sleeveGeo, new THREE.MeshStandardMaterial({ map: kraft, roughness: .92, side: THREE.DoubleSide })); hot.add(sleeve);
const lidPts = [new THREE.Vector2(.585, H - .04), new THREE.Vector2(.6, H + .02), new THREE.Vector2(.585, H + .08), new THREE.Vector2(.53, H + .1), new THREE.Vector2(.5, H + .17), new THREE.Vector2(.44, H + .19), new THREE.Vector2(.001, H + .2)];
const lid = new THREE.Mesh(new THREE.LatheGeometry(lidPts, 128), new THREE.MeshPhysicalMaterial({ color: '#fdfdfb', roughness: .3, clearcoat: .7, side: THREE.DoubleSide })); hot.add(lid);
const sip = new THREE.Mesh(new THREE.CapsuleGeometry(.03, .1, 4, 12), new THREE.MeshStandardMaterial({ color: '#2a1a10' })); sip.rotation.z = Math.PI / 2; sip.position.set(0, H + .19, .3); hot.add(sip);
const steamTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const steam = [];
for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0 })); s.userData = { t: Math.random(), x: (Math.random() - .5) * .3, sp: .25 + Math.random() * .25 }; hot.add(s); steam.push(s); }

const iced = new THREE.Group(); cup.add(iced);
const clear = new THREE.Mesh(new THREE.LatheGeometry(prof(.4, .58, H * 1.02), 128), new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, roughness: .04, thickness: .06, ior: 1.4, transparent: true, side: THREE.DoubleSide, envMapIntensity: 1.4 }));
iced.add(clear);
iceTex.wrapS = THREE.RepeatWrapping; iceTex.offset.x = .5;
const marker = new THREE.Mesh(new THREE.LatheGeometry(prof(.405, .585, H * 1.02), 128), new THREE.MeshBasicMaterial({ map: iceTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
iced.add(marker);
const dome = new THREE.Mesh(new THREE.SphereGeometry(.6, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2.6), new THREE.MeshPhysicalMaterial({ color: '#fff', transmission: 1, roughness: .03, thickness: .04, transparent: true, side: THREE.DoubleSide }));
dome.scale.y = .55; dome.position.y = H * 1.02; iced.add(dome);
const layerMat = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: .25, clearcoat: .6, clearcoatRoughness: .2, sheen: .4, sheenColor: '#ffffff' });
const lower = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 64), layerMat('#e9dcc7'));
const upper = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 64), layerMat('#6b3e1f'));
iced.add(lower, upper);
const ice = [];
const iceMat = new THREE.MeshPhysicalMaterial({ color: '#eef8ff', roughness: .08, metalness: 0, clearcoat: 1, transparent: true, opacity: .55, envMapIntensity: 1.6 });
for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .2, 2, 2, 2), iceMat); m.userData = { a: i / 6 * Math.PI * 2, r: .16 + (i % 2) * .12, ph: Math.random() * 6 }; iced.add(m); ice.push(m); }
const straw = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 2.3, 20), new THREE.MeshStandardMaterial({ color: '#00704a', roughness: .35 }));
straw.position.set(.12, H * .95, .05); straw.rotation.z = -.16; iced.add(straw);
function layerShape(r0, r1, y0, y1, mesh) { const rAt = y => r0 + (r1 - r0) * (y / (H * 1.02)); const top = rAt(y1) - .02, bot = rAt(y0) - .02; mesh.geometry.dispose(); mesh.geometry = new THREE.CylinderGeometry(top, bot, Math.max(.001, y1 - y0), 64); mesh.position.y = (y0 + y1) / 2; }

// builder panel
let sizeKey = 'grande', modeK = 0, modeWant = 0, scaleCur = 1, scaleVel = 0, fill = 0, spinKick = 0;
$('#drinks').innerHTML = BUILD.map(([id, b]) => `<button data-d="${id}" aria-pressed="${id === drink}"><i style="background:${b.dot}"></i><span>${esc(b.label || P[id].n)}${P[id].hol ? '<small>Holiday</small>' : ''}</span></button>`).join('');
function animateNum(el, to) { const from = +el.textContent || 0, t0 = performance.now(); const st = t => { const k = Math.min(1, (t - t0) / 400); el.textContent = (from + (to - from) * k).toFixed(2); if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); }
function apply() {
  const p = P[drink], b = BM[drink], r = rating(p);
  $('#drinkName').textContent = b.label || p.n; $('#kcal').textContent = Math.round(p.k * SZ[sizeKey]);
  $('#bRate').innerHTML = `<b>★</b> ${r.avg.toFixed(1)}`;
  animateNum($('#price'), p.price[sizeKey]);
  modeWant = b.mode === 'iced' ? 1 : 0;
  if (b.mode === 'iced') { lower.material.color.set(b.low); upper.material.color.set(b.up); fill = 0; }
  $('.builder').classList.toggle('xmas', !!b.red);
  drawCup();
}
function selectDrink(id) { if (!BM[id]) return; drink = id; $$('#drinks button').forEach(x => x.setAttribute('aria-pressed', x.dataset.d === id)); apply(); spinKick += 1.2; }
$('#drinks').addEventListener('click', e => { const b = e.target.closest('button'); if (b) selectDrink(b.dataset.d); });
$$('#sizes button').forEach(b => b.addEventListener('click', () => { $$('#sizes button').forEach(x => x.setAttribute('aria-pressed', x === b)); sizeKey = b.dataset.s; apply(); }));
$('#orderBtn').addEventListener('click', e => addToBag({ id: drink, size: sizeKey, milk: P[drink].milk ? (P[drink].milkDef || '2% milk') : null, adds: [], rm: [], qty: 1, cup: cupName.trim() }, e.currentTarget));
$('#customBtn').addEventListener('click', () => openProduct(drink, { size: sizeKey, cup: cupName.trim() }));

// write your name on the cup
const stage = $('#stage'), cupInput = $('#cupName'), panelInput = $('#name'), hintText = $('#hintText');
function setName(v, from) {
  cupName = v.replace(/\s+/g, ' ').replace(/^\s/, '').slice(0, 40);
  if (from !== cupInput) cupInput.value = cupName;
  if (from !== panelInput) panelInput.value = cupName;
  drawCup();
}
function startEdit() {
  if (editing) return;
  editing = true; stage.classList.add('editing'); hintText.textContent = 'Type your name · press Enter when done';
  cupInput.value = cupName; cupInput.focus({ preventScroll: true });
  const n = cupInput.value.length; cupInput.setSelectionRange(n, n);
  drawCup();
}
function endEdit() { if (!editing) return; editing = false; stage.classList.remove('editing'); hintText.textContent = 'Tap the name on the cup to change it'; setName(cupName.trim()); }
cupInput.addEventListener('input', () => setName(cupInput.value, cupInput));
cupInput.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); cupInput.blur(); } });
cupInput.addEventListener('blur', endEdit);
panelInput.addEventListener('input', () => setName(panelInput.value, panelInput));
$('#nameHint').addEventListener('pointerdown', e => e.preventDefault());
$('#nameHint').addEventListener('click', () => editing ? cupInput.blur() : startEdit());
setInterval(() => { if (editing) { caretOn = !caretOn; drawCup(); } }, 530);
if (acct) setName(acct.name);

const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
function hitName(e) {
  const r = canvas.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(hot.visible ? [paper] : [clear], false)[0];
  return !!(hit && hit.uv && hit.uv.y < (hot.visible ? .3 : .45));
}
let rotY = -.35, rotVel = 0, drag = false, moved = 0, lastX = 0, tiltX = 0, tiltWant = 0;
canvas.addEventListener('pointerdown', e => { drag = true; moved = 0; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (drag) { const dx = e.clientX - lastX; moved += Math.abs(dx); rotVel = dx * .01; lastX = e.clientX; } else canvas.classList.toggle('over-name', hitName(e)); });
canvas.addEventListener('pointerup', e => { drag = false; if (moved < 6) { if (hitName(e)) { e.preventDefault(); startEdit(); } else if (editing) cupInput.blur(); } });
addEventListener('pointermove', e => { tiltWant = ((e.clientY / innerHeight) - .5) * .18; });
function resize() { const r = canvas.parentElement.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(canvas.parentElement); resize();
const clock = new THREE.Clock();
let visible = true; new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(canvas);
function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  modeK += (modeWant - modeK) * Math.min(1, dt * 5);
  const swap = Math.sin(Math.PI * Math.min(1, Math.abs(modeK - modeWant) * 3));
  hot.visible = modeK < .5; iced.visible = modeK >= .5;
  const target = SZ[sizeKey]; scaleVel += (target - scaleCur) * 180 * dt; scaleVel *= Math.pow(.0009, dt); scaleCur += scaleVel * dt;
  const squash = 1 - swap * .25;
  cup.scale.set(scaleCur * squash, scaleCur, scaleCur * squash);
  cup.position.y = -.05 - swap * .4 + (reduce ? 0 : Math.sin(t * 1.3) * .03);
  shadowM.scale.setScalar(scaleCur * (1 - (cup.position.y + .05) * .6));
  if (editing) { const home = Math.round(rotY / (2 * Math.PI)) * 2 * Math.PI; rotY += (home - rotY) * .12; rotVel = 0; }
  else {
    if (!drag && !reduce) rotVel += (.0035 - rotVel) * .03;
    if (spinKick > 0) { const s = Math.min(spinKick, dt * 6); rotY += s * 2.2; spinKick -= s; }
    rotY += rotVel; if (!drag) rotVel *= .985;
  }
  tiltX += ((editing ? 0 : tiltWant) - tiltX) * .05; cup.rotation.set(tiltX, rotY, 0);
  steam.forEach(s => { const u = s.userData; u.t += dt * u.sp; if (u.t > 1) { u.t = 0; u.x = (Math.random() - .5) * .3; } s.position.set(u.x + Math.sin(u.t * 6 + u.sp * 9) * .08, H + .25 + u.t * 1.1, .1); const sc = .25 + u.t * .6; s.scale.set(sc, sc, 1); s.material.opacity = Math.sin(u.t * Math.PI) * .45; });
  if (iced.visible) {
    const b = BM[drink];
    fill = Math.min(1, fill + dt * .9); const e = 1 - Math.pow(1 - fill, 3);
    const top = H * .9 * e, split = top * (b.split || .5);
    layerShape(.4, .58, .02, Math.max(.03, split), lower); layerShape(.4, .58, Math.max(.03, split), Math.max(.04, top), upper);
    ice.forEach(m => { const u = m.userData; m.position.set(Math.cos(u.a + t * .2) * u.r, top - .08 + Math.sin(t * 1.6 + u.ph) * .03, Math.sin(u.a + t * .2) * u.r); m.rotation.set(t * .3 + u.ph, t * .2, u.ph); m.visible = e > .6; });
  }
  renderer.render(scene, camera);
}
apply(); frame();

// ---------- rail drag + card tilt ----------
const rail = $('#rail'); let down = false, sx = 0, sl = 0, railMoved = false;
rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; railMoved = false; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('drag'); });
addEventListener('pointermove', e => { if (!down) return; const d = e.clientX - sx; if (Math.abs(d) > 5) railMoved = true; rail.scrollLeft = sl - d; });
addEventListener('pointerup', () => { down = false; rail.classList.remove('drag'); setTimeout(() => railMoved = false, 0); });
function bindCardTilt() {
  $$('.card').forEach(c => { if (c.dataset.tb) return; c.dataset.tb = 1; c.addEventListener('pointermove', e => { if (down || reduce || e.pointerType !== 'mouse') return; const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`; }); c.addEventListener('pointerleave', () => c.style.transform = ''); });
}
function bindTiles() {
  $$('.tile').forEach(c => {
    if (c.dataset.tb) return; c.dataset.tb = 1;
    c.addEventListener('pointermove', e => { if (reduce || e.pointerType !== 'mouse') return; const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; c.style.transform = `perspective(1000px) rotateY(${(x - .5) * 8}deg) rotateX(${-(y - .5) * 8}deg)`; c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%'); });
    c.addEventListener('pointerleave', () => c.style.transform = '');
  });
  bindLightbox();
}

// ---------- holiday: snow + countdown ----------
(() => {
  const now = new Date(); let xm = new Date(now.getFullYear(), 11, 25); if (now > new Date(now.getFullYear(), 11, 26)) xm = new Date(now.getFullYear() + 1, 11, 25);
  const days = Math.ceil((xm - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
  $('#countdown').textContent = days === 0 ? 'Merry Christmas!' : days === 1 ? '1 day to Christmas' : `${days} days to Christmas`;
  const cv = $('#snow'), g = cv.getContext('2d'), sec = $('#holiday'); let on = false, W = 0, Hh = 0;
  const fl = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 2.2, s: .15 + Math.random() * .5, w: Math.random() * 6 }));
  const size = () => { const r = sec.getBoundingClientRect(), d = Math.min(devicePixelRatio, 1.5); W = cv.width = r.width * d; Hh = cv.height = r.height * d; };
  new ResizeObserver(size).observe(sec);
  new IntersectionObserver(([e]) => on = e.isIntersecting).observe(sec);
  let last = performance.now();
  const loop = t => { requestAnimationFrame(loop); const dt = Math.min(.05, (t - last) / 1000); last = t; if (!on || reduce) return; g.clearRect(0, 0, W, Hh); g.fillStyle = 'rgba(255,255,255,.8)'; fl.forEach(f => { f.y += f.s * dt * .12; f.w += dt; if (f.y > 1.02) { f.y = -.02; f.x = Math.random(); } const x = (f.x + Math.sin(f.w) * .008) * W, y = f.y * Hh; g.beginPath(); g.arc(x, y, f.r * (W / 1400 + .6), 0, 7); g.fill(); }); };
  requestAnimationFrame(loop);
})();

// ---------- scroll effects: bean path, roaster parallax, pinned interiors ----------
const path = $('#beanPath'), len = path.getTotalLength(), stepsEl = $$('.step'), pw = $('#pathWrap');
path.style.strokeDasharray = `${len}`; path.style.strokeDashoffset = `${len}`;
const ins = $('#inside'), itrack = $('#itrack'), iprog = $('#iprog'), icount = $('#icount'), jbg = $('#jbg'), journeyEl = $('#journey');
function fitInside() { ins.style.height = (innerHeight + Math.max(0, itrack.scrollWidth - innerWidth)) + 'px'; }
addEventListener('resize', fitInside); fitInside();
function tick() {
  const r = pw.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight * .8 - r.top) / (r.height + innerHeight * .3)));
  path.style.strokeDashoffset = `${len * (1 - p)}`; stepsEl.forEach((s, i) => s.classList.toggle('on', p > i / 4 + .02 || reduce));
  const jr = journeyEl.getBoundingClientRect(); jbg.style.setProperty('--jy', ((jr.top + jr.height / 2 - innerHeight / 2) * -.12).toFixed(1) + 'px');
  const ir = ins.getBoundingClientRect(), span = ir.height - innerHeight, ip = span > 0 ? Math.min(1, Math.max(0, -ir.top / span)) : 0;
  const extra = Math.max(0, itrack.scrollWidth - innerWidth);
  itrack.style.transform = `translate3d(${-ip * extra}px,0,0)`; iprog.style.width = ip * 100 + '%';
  const rooms = $$('.room'); icount.textContent = String(Math.min(rooms.length, 1 + Math.round(ip * (rooms.length - 1)))).padStart(2, '0');
  if (ir.top < innerHeight && ir.bottom > 0) rooms.forEach(rm => { const rr = rm.getBoundingClientRect(), c = (rr.left + rr.width / 2) / innerWidth - .5; rm.style.setProperty('--px', (c * -7).toFixed(2) + '%'); });
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ---------- map ----------
const SHOPS = [{ x: 220, y: 150, n: 'Market Square', h: 'open until 10 pm', d: '0.2 mi' }, { x: 455, y: 230, n: 'Riverside Park', h: 'open until 9 pm', d: '0.6 mi' }, { x: 640, y: 110, n: 'Grand Boulevard', h: 'open 24 hours', d: '0.9 mi' }, { x: 820, y: 300, n: 'Central Station', h: 'open until 11 pm', d: '1.3 mi' }];
const svg = $('#map svg'), tip = $('#tip'), mapEl = $('#map');
SHOPS.forEach(s => {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `<circle class="pulse" cx="${s.x}" cy="${s.y}" r="18" fill="#00704a" opacity=".5"/><g class="pin2" style="cursor:pointer"><circle cx="${s.x}" cy="${s.y}" r="16" fill="#00704a" stroke="#fff" stroke-width="4"/><text x="${s.x}" y="${s.y + 6}" text-anchor="middle" font-size="16" fill="#fff">★</text></g>`;
  const show = () => { const r = mapEl.getBoundingClientRect(), vb = svg.viewBox.baseVal, sc = Math.max(r.width / vb.width, r.height / vb.height), ox = (r.width - vb.width * sc) / 2, oy = (r.height - vb.height * sc) / 2; tip.style.left = (ox + s.x * sc) + 'px'; tip.style.top = (oy + s.y * sc) + 'px'; tip.innerHTML = `<b>${s.n}</b>${s.h} · ${s.d}`; tip.classList.add('show'); };
  g.addEventListener('pointerenter', show); g.addEventListener('click', show); g.addEventListener('pointerleave', () => tip.classList.remove('show'));
  svg.appendChild(g);
});

// ---------- reveals ----------
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
function observeReveals() { $$('.reveal:not(.in), .mask:not(.in)').forEach(el => io.observe(el)); }
observeReveals();
if (!matchMedia('(hover: hover)').matches) $('#locHint').textContent = 'Tap a card to see the outside and the inside, full size.';

renderBag(); updateStarsUI(); bindMcardTilt();
