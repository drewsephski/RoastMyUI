"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SuccessModal } from '@/components/SuccessModal';
import { verifyPurchase } from '@/app/actions';

interface PaymentSuccessHandlerProps {
    onCreditsUpdated: (credits: number) => void;
}

export const PaymentSuccessHandler: React.FC<PaymentSuccessHandlerProps> = ({ onCreditsUpdated }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [addedCredits, setAddedCredits] = useState(0);

    useEffect(() => {
        if (searchParams.get('payment') === 'success') {
            // Clean up URL immediately
            router.replace('/');

            // Verify purchase with Polar API
            const verify = async () => {
                try {
                    const result = await verifyPurchase();
                    if (result.creditsAdded > 0) {
                        setAddedCredits(result.creditsAdded);
                        setShowSuccessModal(true);
                    }
                    onCreditsUpdated(result.newBalance);
                } catch (error) {
                    console.error('Failed to verify purchase:', error);
                }
            };

            verify();
        }
    }, [searchParams, router, onCreditsUpdated]);

    return (
        <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            creditsAdded={addedCredits}
        />
    );
};
