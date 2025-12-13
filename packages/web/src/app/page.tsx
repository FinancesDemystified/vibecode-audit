'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { urlSchema } from '@vibecode-audit/shared';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { trpc } from '../lib/trpc';

const formSchema = z.object({
  url: urlSchema,
  email: z.string().email().optional(),
  attestation: z.boolean().refine((val) => val === true, {
    message: 'You must attest that you own this URL',
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const router = useRouter();
  const submitMutation = trpc.scan.submit.useMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await submitMutation.mutateAsync({
        url: data.url,
        email: data.email,
      });
      if (result.jobId) {
        router.push(`/scan/${result.jobId}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">VibeCode Audit</h1>
      <p className="text-gray-600 mb-8">
        Get instant security feedback for your web application. Just enter a URL.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-1">
            Website URL
          </label>
          <input
            id="url"
            type="url"
            {...register('url')}
            className="w-full px-4 py-2 border rounded-md"
            placeholder="https://example.com"
          />
          {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-4 py-2 border rounded-md"
            placeholder="your@email.com"
          />
        </div>

        <div className="flex items-start">
          <input
            id="attestation"
            type="checkbox"
            {...register('attestation')}
            className="mt-1 mr-2"
          />
          <label htmlFor="attestation" className="text-sm">
            I own this URL or have permission to scan it
          </label>
        </div>
        {errors.attestation && (
          <p className="text-red-500 text-sm">{errors.attestation.message}</p>
        )}

        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {submitMutation.isPending ? 'Submitting...' : 'Start Security Scan'}
        </button>
      </form>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Free Tier:</strong> 3 scans per day per IP address. External URL analysis only.
        </p>
      </div>
    </main>
  );
}

