import React, { useState, useEffect } from 'react';
import { ShoppingBag, ShieldCheck, Clock, Check, AlertCircle } from 'lucide-react';

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
      isPreselected: true, // Pre-selected extra!
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
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
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
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
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
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
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
      isPreselected: false, // Unchecked! Clean practice
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
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
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
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
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
  const [activeTab, setActiveTab] = useState<'details' | 'planted_notes'>('details');

  useEffect(() => {
    setIsAddonChecked(Boolean(currentProduct.addonOption?.isPreselected));
    setShowDeclineModal(false);
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
      className="w-full bg-[#FFFFFF] border border-[#E1E8F0] rounded-[24px] overflow-hidden shadow-sm"
      data-action-area="true"
    >
      {/* Test Shop Top Navigation Bar */}
      <div className="bg-[#F6F9FC] border-b border-[#E1E8F0] px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-lg text-[#1F2A37] tracking-tight">
            Apex Goods Demo Shop
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EDF2F8] text-[#5F6E80] font-mono">
            demo.darkguard.shop
          </span>
        </div>

        {/* Product scenario selector pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EDF2F8] rounded-xl">
          {PRODUCTS.map((prod) => (
            <button
              key={prod.id}
              onClick={() => onSelectProduct(prod.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                prod.id === currentProduct.id
                  ? 'bg-white text-[#1F2A37] shadow-2xs'
                  : 'text-[#5F6E80] hover:text-[#1F2A37]'
              }`}
            >
              {prod.isPlanted ? '⚠️ Planted: ' : '✓ Clean: '}
              {prod.name.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#3D4B5C] bg-white border border-[#E1E8F0] px-3 py-1.5 rounded-lg shadow-2xs font-medium">
            <ShoppingBag className="w-3.5 h-3.5 text-[#1D4E89]" />
            <span>Cart ({cartCount})</span>
          </div>
        </div>
      </div>

      {/* Scenario Banner */}
      <div
        className={`px-6 py-2.5 text-xs border-b flex flex-wrap items-center justify-between gap-2 ${
          currentProduct.isPlanted
            ? 'bg-[#FCE0D6]/40 border-[#F1A98F]/50 text-[#8A3A1F]'
            : 'bg-[#D9F2E6]/40 border-[#8FD1B0]/50 text-[#14513A]'
        }`}
      >
        <div className="flex items-center gap-2 font-medium">
          {currentProduct.isPlanted ? (
            <AlertCircle className="w-4 h-4 text-[#8A3A1F]" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-[#14513A]" />
          )}
          <span>
            {currentProduct.isPlanted
              ? `Planted Deceptive Patterns (${currentProduct.plantedSummary.length} deliberate anomalies)`
              : 'Clean Baseline Control Page (Zero dark patterns)'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-semibold">{currentProduct.category}</span>
        </div>
      </div>

      {/* Product Content Split */}
      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Image & Planted Breakdown */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="w-full h-80 rounded-[20px] overflow-hidden border border-[#E1E8F0] bg-[#EDF2F8] relative">
            <img
              src={currentProduct.imageUrl}
              alt={currentProduct.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {currentProduct.hasCountdown && (
              <div
                className="absolute top-3 left-3 bg-[#1F2A37]/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 shadow-sm timer countdown"
                data-dg-target="timer"
                data-dg-frozen={currentProduct.isCountdownFrozen ? 'true' : 'false'}
              >
                <Clock className="w-3.5 h-3.5 text-[#EBD27A]" />
                <span>Ends in: </span>
                <span className="font-bold text-[#EBD27A]">
                  {currentProduct.countdownInitial}
                </span>
              </div>
            )}
          </div>

          {/* Planted Patterns Inspection Box */}
          <div className="bg-[#F6F9FC] border border-[#E1E8F0] rounded-[16px] p-4 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-semibold text-[#1F2A37]">
                Ground Truth Blueprint
              </span>
              <span className="text-[10px] uppercase font-bold text-[#5F6E80] tracking-wider">
                {currentProduct.isPlanted ? 'Planted Anomaly' : 'Clean Reference'}
              </span>
            </div>
            <ul className="space-y-1.5 text-[#3D4B5C]">
              {currentProduct.plantedSummary.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#1D4E89] shrink-0 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Product Details & Actions */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-[#5F6E80] mb-1">
              {currentProduct.category}
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-[#1F2A37] tracking-tight leading-tight">
              {currentProduct.name}
            </h1>
          </div>

          {/* Pricing Area with PRD-compliant structure */}
          <div
            className="price-container pricing product-pricing p-4 rounded-[16px] bg-[#F6F9FC] border border-[#E1E8F0] flex flex-wrap items-center justify-between gap-4"
            data-price-group="true"
          >
            <div className="flex items-baseline gap-3">
              <span className="current-price font-display font-bold text-3xl text-[#1F2A37]">
                ${currentProduct.currentPrice.toFixed(2)}
              </span>
              {currentProduct.referencePrice && (
                <span className="reference-price line-through text-[#5F6E80] text-lg font-medium">
                  was ${currentProduct.referencePrice.toFixed(2)}
                </span>
              )}
            </div>

            {currentProduct.statedDiscountPercent && (
              <div
                className="discount badge px-3 py-1 rounded-full text-xs font-bold bg-[#FCE0D6] border border-[#F1A98F] text-[#8A3A1F]"
                data-dg-target="discount"
              >
                {currentProduct.statedDiscountPercent}% OFF SPECIAL
              </div>
            )}
          </div>

          {/* Urgency message text if any */}
          {currentProduct.urgencyText && (
            <div
              className="urgent bg-[#FBF0C9] border border-[#EBD27A] text-[#6B4E00] px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 font-medium"
              data-dg-target="urgency"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{currentProduct.urgencyText}</span>
            </div>
          )}

          {/* Product description & bullet specs */}
          <p className="text-sm text-[#3D4B5C] leading-relaxed">
            {currentProduct.description}
          </p>

          <div className="space-y-2 border-t border-b border-[#E1E8F0] py-4 text-xs text-[#3D4B5C]">
            {currentProduct.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#14513A]" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* Purchase Actions & Pre-selected Extras Checkbox */}
          <div className="product-actions cart-actions flex flex-col gap-4">
            {currentProduct.addonOption && (
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer select-none transition-colors ${
                  isAddonChecked
                    ? 'bg-[#DCEBFA]/30 border-[#9CC5EE]'
                    : 'bg-[#F6F9FC] border-[#E1E8F0]'
                }`}
              >
                <input
                  type="checkbox"
                  id={currentProduct.addonOption.id}
                  checked={isAddonChecked}
                  onChange={(e) => setIsAddonChecked(e.target.checked)}
                  className="mt-0.5 rounded border-[#C9D4E0] text-[#1D4E89] focus:ring-[#5B9BE0] w-4 h-4"
                  data-dg-target="addon"
                />
                <div className="flex-1">
                  <span className="font-semibold text-[#1F2A37] block">
                    {currentProduct.addonOption.label}
                  </span>
                  <span className="text-[11px] text-[#5F6E80]">
                    {currentProduct.addonOption.isPreselected
                      ? 'Pre-selected option added directly to cart'
                      : 'Optional coverage available on request'}
                  </span>
                </div>
              </label>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full sm:flex-1 h-12 bg-[#1D4E89] hover:bg-[#153a66] text-white font-semibold text-sm rounded-[14px] transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                data-buy-button="true"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  Add to Cart · ${(currentProduct.currentPrice + (isAddonChecked && currentProduct.addonOption ? currentProduct.addonOption.price : 0)).toFixed(2)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeclineModal(true)}
                className="w-full sm:w-auto px-4 h-12 bg-white border border-[#C9D4E0] hover:bg-slate-50 text-[#1F2A37] font-semibold text-xs rounded-[14px] transition-colors cursor-pointer"
              >
                Decline & Options
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Decline / Offer Dismissal Modal (For Demonstrating DP-3 Confirm Shaming) */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-[#1F2A37]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E1E8F0] rounded-[24px] max-w-md w-full p-6 shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[#1F2A37]">
                Wait! Before you continue...
              </h3>
              <button
                onClick={() => setShowDeclineModal(false)}
                className="text-[#5F6E80] hover:text-[#1F2A37] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#3D4B5C] leading-relaxed">
              {currentProduct.isPlanted
                ? 'Exclusive member benefits and discount guarantees are currently applied to your selection.'
                : 'You are viewing standard configuration options for your selected product.'}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="w-full py-2.5 bg-[#DCEBFA] border border-[#9CC5EE] text-[#1D4E89] font-semibold text-xs rounded-xl hover:bg-[#c5e0fa] transition-colors"
              >
                Keep applied special benefits
              </button>

              {/* The decline button targeted by DP-3 */}
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="w-full py-2 bg-transparent text-[#5F6E80] hover:text-[#1F2A37] text-xs font-medium underline underline-offset-4 cursor-pointer decline-btn secondary-action"
                data-dg-action="decline"
              >
                {currentProduct.declineButtonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
