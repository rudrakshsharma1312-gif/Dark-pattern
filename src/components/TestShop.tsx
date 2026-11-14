import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ShieldCheck, Clock, Check, AlertCircle, Package, X } from 'lucide-react';

export interface ProductScenario {
  id: string;
  name: string;
  category: string;
  isPlanted: boolean;
  plantedSummary: string[];
  currentPrice: number;
  referencePrice?: number;
  statedDiscountPercent?: number;
  hasCountdown: boolean;
  countdownInitial: string;
  isCountdownFrozen: boolean;
  urgencyText?: string;
  addonOption?: {
    id: string;
    label: string;
    price: number;
    isPreselected: boolean;
  };
  declineButtonText: string;
  isDeclineShaming: boolean;
  description: string;
  features: string[];
  imageUrl: string;
}

export const PRODUCTS: ProductScenario[] = [
  {
    id: 'headphones-pro',
    name: 'AuraSound Pro Noise-Cancelling Headphones',
    category: 'Audio Hardware',
    isPlanted: true,
    plantedSummary: [
      'DP-1: Frozen countdown timer (00:14:59 does not tick down)',
      'DP-2: Misleading 60% discount claim ($200 to $120 is actually 40%)',
      'DP-3: Confirm shaming decline option ("No thanks, I don\'t care about audio quality")',
      'DP-4: Pre-selected $19.99 warranty add-on checked by default',
    ],
    currentPrice: 120.0,
    referencePrice: 200.0,
    statedDiscountPercent: 60, // Misleading! (200 - 120) / 200 = 40%
    hasCountdown: true,
    countdownInitial: '00:14:59',
    isCountdownFrozen: true,
    urgencyText: 'Hurry! Flash Deal reserved in cart for limited time',
    addonOption: {
      id: 'warranty-2yr',
      label: 'Add 2-Year Accidental Damage & Extended Protection Plan ($19.99)',
      price: 19.99,
      isPreselected: true,
    },
    declineButtonText: "No thanks, I don't care about audio quality",
    isDeclineShaming: true,
    description:
      'Engineered with 40mm beryllium drivers, active hybrid noise cancellation, and 30-hour battery life.',
    features: [
      'Hybrid active noise cancellation with transparency mode',
      'Lossless LDAC, AAC, and aptX HD audio codecs',
      'Ergonomic memory-foam ear cushions with protein leather',
      'Multipoint Bluetooth 5.3 pairing across devices',
    ],
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="400" height="300" fill="%23141720"/><circle cx="200" cy="150" r="70" fill="none" stroke="%23E6B85C" stroke-width="4"/><path d="M150 150 A50 50 0 0 1 250 150" fill="none" stroke="%23CBD2DC" stroke-width="6"/><rect x="135" y="140" width="22" height="45" rx="10" fill="%23E6B85C"/><rect x="243" y="140" width="22" height="45" rx="10" fill="%23E6B85C"/><text x="200" y="250" text-anchor="middle" fill="%23CBD2DC" font-family="sans-serif" font-size="14" font-weight="600">AuraSound Pro Studio</text></svg>',
  },
  {
    id: 'nordic-lamp',
    name: 'Nordic Glow Ergonomic Task Lamp',
    category: 'Home & Studio',
    isPlanted: true,
    plantedSummary: [
      'DP-1: Frozen deadline timer (02:45:00 remaining)',
      'DP-2: Misleading 50% discount claim ($100 to $70 is 30%)',
      'DP-3: Confirm shaming ("No, I prefer bad posture")',
      'DP-4: Pre-selected bulb replacement subscription',
    ],
    currentPrice: 70.0,
    referencePrice: 100.0,
    statedDiscountPercent: 50, // Misleading! (100 - 70) / 100 = 30%
    hasCountdown: true,
    countdownInitial: '02:45:00',
    isCountdownFrozen: true,
    urgencyText: 'Special Studio Offer expires in 02:45:00',
    addonOption: {
      id: 'bulb-insurance',
      label: 'Auto-include Lifetime Premium LED Replacement Care ($9.99)',
      price: 9.99,
      isPreselected: true,
    },
    declineButtonText: 'No, I prefer bad posture and dim light',
    isDeclineShaming: true,
    description:
      'Minimalist aluminum desk lamp with precision balanced counterweight and circadian daylight spectrum tuning.',
    features: [
      '98+ CRI museum-grade true color spectrum',
      'Stepless optical rotary dimmer with memory function',
      'Aircraft-grade sandblasted anodized aluminum arm',
    ],
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="400" height="300" fill="%23141720"/><line x1="160" y1="230" x2="240" y2="230" stroke="%23E6B85C" stroke-width="6" stroke-linecap="round"/><line x1="200" y1="230" x2="200" y2="120" stroke="%23CBD2DC" stroke-width="5"/><line x1="200" y1="120" x2="240" y2="90" stroke="%23E6B85C" stroke-width="5"/><polygon points="230,90 260,80 270,110 240,115" fill="%23E6B85C"/><text x="200" y="265" text-anchor="middle" fill="%23CBD2DC" font-family="sans-serif" font-size="14" font-weight="600">Nordic Glow Task Lamp</text></svg>',
  },
  {
    id: 'swift-runner',
    name: 'SwiftRunner Trail Marathon Carbon Shoes',
    category: 'Footwear & Athletics',
    isPlanted: true,
    plantedSummary: [
      'DP-1: Classifier-only urgency text ("Hurry! Only 2 pairs left in your size")',
      'DP-3: Confirm shaming ("No, I prefer full price")',
      'DP-4: Pre-checked carbon offset insurance ($2.50)',
    ],
    currentPrice: 160.0,
    referencePrice: 190.0,
    statedDiscountPercent: 15,
    hasCountdown: false,
    countdownInitial: '',
    isCountdownFrozen: false,
    urgencyText: 'Hurry! Only 2 pairs left in stock. High demand in your area!',
    addonOption: {
      id: 'carbon-offset',
      label: 'Pre-check Eco-Carbon Offset & Priority Courier Insurance ($2.50)',
      price: 2.5,
      isPreselected: true,
    },
    declineButtonText: 'No, I prefer paying full price without VIP perks',
    isDeclineShaming: true,
    description:
      'Full-length dual-spoon carbon fiber plate enveloped in nitrogen-infused supercritical foam.',
    features: [
      'Vibram Megagrip traction lug geometry',
      'Engineered jacquard ripstop single-layer upper',
      'Integrated rock protection plate for technical terrain',
    ],
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="400" height="300" fill="%23141720"/><path d="M120 180 Q160 140 220 150 Q260 160 280 185 L120 185 Z" fill="%23E6B85C"/><line x1="110" y1="190" x2="290" y2="190" stroke="%23CBD2DC" stroke-width="8" stroke-linecap="round"/><text x="200" y="240" text-anchor="middle" fill="%23CBD2DC" font-family="sans-serif" font-size="14" font-weight="600">SwiftRunner Trail Shoes</text></svg>',
  },
  {
    id: 'clean-tee',
    name: 'Kanso Minimalist Heavyweight Cotton Tee',
    category: 'Apparel (Clean Control Page)',
    isPlanted: false,
    plantedSummary: [
      'Clean: Transparent honest pricing ($32.00, no fake reference slash)',
      'Clean: No artificial urgency countdown or fake scarcity claims',
      'Clean: Optional add-ons unchecked by default',
      'Clean: Neutral decline option ("No thanks")',
    ],
    currentPrice: 32.0,
    referencePrice: undefined,
    statedDiscountPercent: undefined,
    hasCountdown: false,
    countdownInitial: '',
    isCountdownFrozen: false,
    urgencyText: undefined,
    addonOption: {
      id: 'gift-wrap',
      label: 'Optional Japanese furoshiki fabric gift wrapping ($4.00)',
      price: 4.0,
      isPreselected: false,
    },
    declineButtonText: 'No thanks',
    isDeclineShaming: false,
    description:
      'Knitted in Wakayama from 280gsm long-staple organic cotton. Pre-shrunk and finished with a durable bound rib collar.',
    features: [
      '100% GOTS certified organic Aegean cotton',
      'Tubular knit body with no irritating side seams',
      'Reinforced double-needle topstitching',
    ],
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="400" height="300" fill="%23141720"/><path d="M160 90 L240 90 L270 120 L245 140 L230 130 L230 220 L170 220 L170 130 L155 140 L130 120 Z" fill="none" stroke="%23CBD2DC" stroke-width="4"/><text x="200" y="255" text-anchor="middle" fill="%23CBD2DC" font-family="sans-serif" font-size="14" font-weight="600">Kanso Heavyweight Tee</text></svg>',
  },
  {
    id: 'clean-pourover',
    name: 'Artisan Ceramic Pour-Over Dripper',
    category: 'Kitchen & Coffee (Clean Control Page)',
    isPlanted: false,
    plantedSummary: [
      'Clean: Standard retail pricing ($42.00)',
      'Clean: Free from urgency countdowns or phantom timers',
      'Clean: All add-on filters unchecked',
      'Clean: Neutral, objective product information',
    ],
    currentPrice: 42.0,
    referencePrice: undefined,
    statedDiscountPercent: undefined,
    hasCountdown: false,
    countdownInitial: '',
    isCountdownFrozen: false,
    urgencyText: undefined,
    addonOption: {
      id: 'filters-100',
      label: 'Add 100-pack unbleached conical filters ($6.00)',
      price: 6.0,
      isPreselected: false,
    },
    declineButtonText: 'Decline recommendation',
    isDeclineShaming: false,
    description:
      'Hand-thrown stoneware dripper with spiral interior ribs designed to regulate water extraction speed.',
    features: [
      'Durable high-fired porcelain from Arita, Japan',
      'Thermal mass preserves brewing temperature stability',
      'Universal base fits directly over most servers and mugs',
    ],
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="400" height="300" fill="%23141720"/><polygon points="150,110 250,110 220,180 180,180" fill="none" stroke="%23E6B85C" stroke-width="4"/><line x1="160" y1="190" x2="240" y2="190" stroke="%23CBD2DC" stroke-width="5" stroke-linecap="round"/><text x="200" y="245" text-anchor="middle" fill="%23CBD2DC" font-family="sans-serif" font-size="14" font-weight="600">Artisan Pour-Over Dripper</text></svg>',
  },
];

interface TestShopProps {
  onScanTargetReady?: (container: HTMLElement) => void;
  selectedProductId: string;
  onSelectProduct: (id: string) => void;
}

export const TestShop: React.FC<TestShopProps> = ({
  selectedProductId,
  onSelectProduct,
}) => {
  const currentProduct =
    PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0];

  const [isAddonChecked, setIsAddonChecked] = useState(
    Boolean(currentProduct.addonOption?.isPreselected)
  );
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setIsAddonChecked(Boolean(currentProduct.addonOption?.isPreselected));
    setShowDeclineModal(false);
    setImgFailed(false);
  }, [currentProduct.id]);

  const handleAddToCart = () => {
    setCartCount((c) => c + 1);
    if (currentProduct.isPlanted && currentProduct.isDeclineShaming) {
      setShowDeclineModal(true);
    }
  };

  return (
    <div
      id="test-shop-container"
      className="w-full glass-panel rounded-[24px] overflow-hidden"
      data-action-area="true"
    >
      {/* Test Shop Top Navigation Bar */}
      <div className="bg-gradient-to-r from-[var(--bg-bar-from)] to-[var(--bg-bar-to)] border-b border-[var(--line-card)] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-display font-bold text-base text-[var(--ink-900)] tracking-tight whitespace-nowrap">
            Apex Goods Demo Shop
          </span>
          <span aria-hidden="true" className="text-[var(--ink-300)]">·</span>
          <span className="text-[var(--ink-500)] font-mono">
            demo.darkguard.shop
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="glass-control flex items-center gap-1.5 text-xs text-[var(--ink-900)] px-3.5 py-1.5 rounded-full font-medium tabular">
            <ShoppingBag className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Cart ({cartCount})</span>
          </div>
        </div>
      </div>

      {/* Product Scenario Segmented Selector */}
      <div className="px-5 py-3 border-b border-[var(--line-subtle)] bg-[var(--bg-sunken)]">
        <div className="flex flex-wrap items-center gap-1.5">
          {PRODUCTS.map((prod) => {
            const active = prod.id === currentProduct.id;
            return (
              <motion.button
                key={prod.id}
                type="button"
                whileHover={{ y: -1.5, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.14 }}
                onClick={() => onSelectProduct(prod.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full cursor-pointer whitespace-nowrap ${
                  active
                    ? 'btn-primary-tactile text-[#111318] font-semibold'
                    : 'bg-[var(--bg-pill-muted)] text-[var(--ink-500)] hover:text-[var(--ink-900)] border border-[var(--line-card)]'
                }`}
              >
                {prod.isPlanted ? 'Planted: ' : 'Clean: '}
                {prod.name.split(' ')[0]}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Scenario Banner */}
      <div
        className={`px-5 py-2.5 text-xs border-b flex flex-wrap items-center justify-between gap-2 ${
          currentProduct.isPlanted
            ? 'bg-[var(--peach-surface)] border-[var(--peach-line)] text-[var(--peach-ink)]'
            : 'bg-[var(--mint-surface)] border-[var(--mint-line)] text-[var(--mint-ink)]'
        }`}
      >
        <div className="flex items-center gap-2 font-medium">
          {currentProduct.isPlanted ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 shrink-0" />
          )}
          <span>
            {currentProduct.isPlanted
              ? `Planted Deceptive Patterns (${currentProduct.plantedSummary.length} deliberate anomalies)`
              : 'Clean Baseline Control Page (Zero dark patterns)'}
          </span>
        </div>
        <span className="text-[11px] font-medium">{currentProduct.category}</span>
      </div>

      {/* Product Content Split */}
      <AnimatePresence mode="wait">
      <motion.div
        key={currentProduct.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="p-5 md:p-7 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start bg-[var(--bg-shop-body)]"
      >
        {/* Left Column: Product Image & Ground Truth Blueprint */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="w-full h-72 rounded-[20px] overflow-hidden border border-[var(--line-card)] bg-[var(--bg-surface-solid)] relative shadow-xs">
            {!imgFailed ? (
              <img
                src={currentProduct.imageUrl}
                alt={currentProduct.name}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[var(--bg-emblem-from)] to-[var(--bg-emblem-to)] text-[var(--ink-500)] p-4 text-center">
                <Package className="w-9 h-9 text-[var(--ink-300)]" />
                <span className="text-xs font-medium text-[var(--ink-900)]">{currentProduct.name}</span>
              </div>
            )}

            {currentProduct.hasCountdown && (
              <div
                className="absolute top-3 left-3 bg-[var(--bg-timer)] text-[var(--ink-900)] backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-1.5 timer countdown border border-[var(--butter-line)]"
                data-dg-target="timer"
                data-dg-frozen={currentProduct.isCountdownFrozen ? 'true' : 'false'}
              >
                <Clock className="w-3.5 h-3.5 text-[var(--butter-ink)]" />
                <span>Ends in: </span>
                <span className="font-bold text-[var(--butter-ink)] tabular">
                  {currentProduct.countdownInitial}
                </span>
              </div>
            )}
          </div>

          {/* Ground Truth Blueprint */}
          <div className="chrome-card rounded-[18px] p-4 text-xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-display font-semibold text-[var(--ink-900)]">
                Ground Truth Blueprint
              </span>
              <span className="text-[11px] font-medium text-[var(--ink-500)]">
                {currentProduct.isPlanted ? 'Planted anomaly' : 'Clean reference'}
              </span>
            </div>
            <ul className="space-y-1.5 text-[var(--ink-700)]">
              {currentProduct.plantedSummary.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[var(--accent)] shrink-0 font-bold">·</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Product Details & Actions */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div>
            <div className="text-xs font-medium text-[var(--ink-500)] mb-1">
              {currentProduct.category}
            </div>
            <h2 className="font-display font-bold text-2xl text-[var(--ink-900)] tracking-tight leading-tight text-balance">
              {currentProduct.name}
            </h2>
          </div>

          {/* Pricing Area with PRD-compliant selectors */}
          <div
            className="price-container pricing product-pricing chrome-card p-4 rounded-[18px] flex flex-wrap items-center justify-between gap-4"
            data-price-group="true"
          >
            <div className="flex items-baseline gap-3">
              <span className="current-price font-display font-bold text-3xl text-[var(--ink-900)] tabular">
                ${currentProduct.currentPrice.toFixed(2)}
              </span>
              {currentProduct.referencePrice && (
                <span className="reference-price line-through text-[var(--ink-500)] text-base font-medium tabular">
                  was ${currentProduct.referencePrice.toFixed(2)}
                </span>
              )}
            </div>

            {currentProduct.statedDiscountPercent && (
              <div
                className="discount badge px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[var(--bg-badge-from)] to-[var(--bg-badge-to)] text-[var(--accent)] tabular border border-[var(--accent-border)]"
                data-dg-target="discount"
              >
                {currentProduct.statedDiscountPercent}% OFF SPECIAL
              </div>
            )}
          </div>

          {/* Urgency message text if any */}
          {currentProduct.urgencyText && (
            <div
              className="urgent bg-[var(--butter-surface)] border border-[var(--butter-line)] text-[var(--butter-ink)] px-3.5 py-2.5 rounded-[14px] text-xs flex items-center gap-2 font-medium"
              data-dg-target="urgency"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{currentProduct.urgencyText}</span>
            </div>
          )}

          {/* Product description & specs */}
          <p className="text-sm text-[var(--ink-700)] leading-relaxed">
            {currentProduct.description}
          </p>

          <div className="space-y-2 border-t border-b border-[var(--line-card)] py-4 text-xs text-[var(--ink-700)]">
            {currentProduct.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--mint-ink)] shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* Purchase Actions & Pre-selected Extras Checkbox */}
          <div className="product-actions cart-actions flex flex-col gap-4">
            {currentProduct.addonOption && (
              <label
                className={`flex items-start gap-3 p-3.5 rounded-[14px] border text-xs cursor-pointer select-none transition-colors ${
                  isAddonChecked
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-border)]'
                    : 'bg-[var(--bg-surface-solid)] border-[var(--line-card)]'
                }`}
              >
                <input
                  type="checkbox"
                  id={currentProduct.addonOption.id}
                  checked={isAddonChecked}
                  onChange={(e) => setIsAddonChecked(e.target.checked)}
                  className="mt-0.5 rounded border-[var(--line-strong)] accent-[#E6B85C] w-4 h-4 shrink-0"
                  data-dg-target="addon"
                />
                <div className="flex-1">
                  <span className="font-semibold text-[var(--ink-900)] block">
                    {currentProduct.addonOption.label}
                  </span>
                  <span className="text-[11px] text-[var(--ink-500)]">
                    {currentProduct.addonOption.isPreselected
                      ? 'Pre-selected option added directly to cart'
                      : 'Optional coverage available on request'}
                  </span>
                </div>
              </label>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <motion.button
                type="button"
                whileHover={{ y: -1.5, scale: 1.015 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.14 }}
                onClick={handleAddToCart}
                className="btn-primary-tactile w-full sm:flex-1 h-11 text-[#111318] font-semibold text-sm rounded-full flex items-center justify-center gap-2 cursor-pointer tabular whitespace-nowrap"
                data-buy-button="true"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  + Add to Cart · ${(currentProduct.currentPrice + (isAddonChecked && currentProduct.addonOption ? currentProduct.addonOption.price : 0)).toFixed(2)}
                </span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.14 }}
                onClick={() => setShowDeclineModal(true)}
                className="w-full sm:w-auto px-4 h-11 glass-control text-[var(--ink-900)] font-semibold text-xs rounded-full cursor-pointer whitespace-nowrap"
              >
                Decline &amp; Options
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
      </AnimatePresence>

      {/* Decline / Offer Dismissal Modal */}
      <AnimatePresence>
      {showDeclineModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 bg-[var(--modal-backdrop)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel rounded-[24px] max-w-md w-full p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[var(--ink-900)]">
                Wait! Before you continue...
              </h3>
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="text-[var(--ink-500)] hover:text-[var(--ink-900)] p-1 rounded-full cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--ink-700)] leading-relaxed">
              {currentProduct.isPlanted
                ? 'Exclusive member benefits and discount guarantees are currently applied to your selection.'
                : 'You are viewing standard configuration options for your selected product.'}
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="btn-primary-tactile w-full py-2.5 text-[#111318] font-semibold text-xs rounded-full transition-colors cursor-pointer"
              >
                Keep applied special benefits
              </button>

              {/* The decline button targeted by DP-3 */}
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="w-full py-2 bg-transparent text-[var(--ink-500)] hover:text-[var(--ink-900)] text-xs font-medium underline underline-offset-4 cursor-pointer decline-btn secondary-action"
                data-dg-action="decline"
              >
                {currentProduct.declineButtonText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
