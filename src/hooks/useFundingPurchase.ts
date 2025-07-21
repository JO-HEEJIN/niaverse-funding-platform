import { useRouter } from 'next/navigation';
import { parseCustomPrice } from '@/lib/formatters';

interface PurchaseData {
  fundingId?: string;
  fundingTitle?: string;
  quantity?: number | null;
  price: number;
}

export const useFundingPurchase = () => {
  const router = useRouter();

  const proceedToPurchase = ({
    customPrice,
    selectedQuantity,
    funding,
    getPriceForQuantity,
  }: {
    customPrice: string;
    selectedQuantity: number | null;
    funding: { id?: string; title?: string } | null;
    getPriceForQuantity: (quantity: number | null) => number;
  }) => {
    const finalPrice = customPrice
      ? parseCustomPrice(customPrice)
      : getPriceForQuantity(selectedQuantity || 1);

    if (finalPrice < 1_000_000) {
      alert('최소 투자 금액은 ₩1,000,000 이상이어야 합니다.');
      return;
    }

    const purchaseData: PurchaseData = {
      fundingId: funding?.id,
      fundingTitle: funding?.title,
      quantity: selectedQuantity,
      price: finalPrice,
    };

    localStorage.setItem('purchaseData', JSON.stringify(purchaseData));
    router.push('/contract');
  };

  return { proceedToPurchase };
};