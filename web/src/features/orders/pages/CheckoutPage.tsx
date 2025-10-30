import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Label, Select, Textarea, TextInput } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api-client';

interface CheckoutForm {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  paymentMethod: string;
  notes?: string;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CheckoutForm>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    paymentMethod: 'card',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/orders/checkout', {
        paymentMethod: form.paymentMethod,
        shippingAddress: {
          fullName: form.fullName,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          postalCode: form.postalCode,
          notes: form.notes,
        },
      });
    },
    onSuccess: () => {
      setError(null);
      setSuccess('Order placed successfully!');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setTimeout(() => {
        navigate('/');
      }, 1500);
    },
    onError: (err: unknown) => {
      console.error(err);
      setSuccess(null);
      setError('Unable to complete checkout. Please verify your information and try again.');
    },
  });

  const handleChange = (key: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) {
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl py-12 px-4">
      <Card className="border border-slate-200">
        <h1 className="text-3xl font-semibold text-slate-900">Checkout</h1>
        <p className="text-sm text-slate-500">
          Provide your shipping details and confirm your payment preference to place the order.
        </p>
        {error ? <Alert color="failure">{error}</Alert> : null}
        {success ? <Alert color="success">{success}</Alert> : null}
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="fullName" value="Full name" />
            <TextInput
              id="fullName"
              value={form.fullName}
              onChange={(event) => handleChange('fullName', event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="addressLine1" value="Address" />
            <TextInput
              id="addressLine1"
              value={form.addressLine1}
              onChange={(event) => handleChange('addressLine1', event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="addressLine2" value="Apartment, suite, etc. (optional)" />
            <TextInput
              id="addressLine2"
              value={form.addressLine2}
              onChange={(event) => handleChange('addressLine2', event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city" value="City" />
              <TextInput
                id="city"
                value={form.city}
                onChange={(event) => handleChange('city', event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="postalCode" value="Postal code" />
              <TextInput
                id="postalCode"
                value={form.postalCode}
                onChange={(event) => handleChange('postalCode', event.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="paymentMethod" value="Payment method" />
            <Select
              id="paymentMethod"
              value={form.paymentMethod}
              onChange={(event) => handleChange('paymentMethod', event.target.value)}
              required
            >
              <option value="card">Card</option>
              <option value="grabpay">GrabPay</option>
              <option value="cash">Cash</option>
            </Select>
            <p className="mt-1 text-xs text-slate-500">Select the payment method for this order.</p>
          </div>
          <div>
            <Label htmlFor="notes" value="Delivery notes (optional)" />
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(event) => handleChange('notes', event.target.value)}
            />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Placing order…' : 'Place order'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
