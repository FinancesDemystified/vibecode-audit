/**
 * Landing page marketing content
 * Dependencies: React
 * Purpose: Marketing sections below hero
 */
'use client';

export default function LandingContent() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const urlInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (urlInput) {
        urlInput.focus();
      }
    }, 500);
  };

  return (
    <div className="mt-24 space-y-24">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          You think you're 90% done. Here's the reality:
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Research shows <span className="font-semibold text-red-600">40%+ of AI-built apps leak user data</span>—names, emails, phone numbers. 
          <span className="font-semibold"> 1 in 3 has critical security holes</span> that hackers can exploit in minutes.
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
          <div className="bg-red-50 rounded-2xl p-6">
            <div className="text-5xl font-bold text-red-600 mb-2">40%+</div>
            <p className="text-gray-700 font-medium">leak sensitive user data</p>
            <p className="text-sm text-gray-600 mt-2">Without you knowing</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-6">
            <div className="text-5xl font-bold text-red-600 mb-2">1 in 3</div>
            <p className="text-gray-700 font-medium">has critical security problems</p>
            <p className="text-sm text-gray-600 mt-2">That could shut you down</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-6">
            <div className="text-5xl font-bold text-red-600 mb-2">1 in 10</div>
            <p className="text-gray-700 font-medium">apps copy the same critical flaw</p>
            <p className="text-sm text-gray-600 mt-2">AI replicates vulnerabilities</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          AI optimizes for "working," not "secure"
        </h2>
        <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
          <p>
            You built your app with AI. It works. You're ready to launch.
          </p>
          <p>
            But research from analyzing <span className="font-semibold text-red-600">2,000+ vulnerable apps</span> shows that 
            <span className="font-semibold"> 40%+ leak sensitive data</span>—names, emails, phone numbers, financials. 
            <span className="font-semibold"> 20% allow unrestricted database access</span> where anyone can view, create, edit, or delete records.
          </p>
          <p>
            When Row Level Security (RLS) breaks features, AI "fixes" by disabling protection. When authentication is complex, 
            AI suggests workarounds that expose your data. When secrets are needed, AI puts them in frontend builds where anyone can see them.
          </p>
          <p>
            You don't need to become a security expert. You just need to find vulnerabilities before hackers do.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What we check that you probably haven't
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            These are the things non-technical founders don't know to check—but hackers know to look for.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Data Leakage</p>
                  <p className="text-sm">Public databases, missing RLS, anonymous access</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Exposed Secrets</p>
                  <p className="text-sm">API keys in frontend, .env files in production</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Auth Bypasses</p>
                  <p className="text-sm">Weak authentication, exposed admin panels</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Missing Validation</p>
                  <p className="text-sm">No CSRF, XSS protection, input sanitization</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">CORS Issues</p>
                  <p className="text-sm">APIs accepting requests from any origin</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Architecture Gaps</p>
                  <p className="text-sm">Client-side logic, schema exposure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          We check everything you don't know to check
        </h2>
        <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
          <p>
            You don't need to understand authentication flows or database security. We do. Our scanner checks everything 
            in minutes: Can anyone access your database without logging in? Are your API keys visible in the frontend? 
            Can users see other users' data? Is your admin panel protected?
          </p>
          <p>
            Every issue we find comes with <span className="font-semibold">plain English explanations</span> and 
            <span className="font-semibold"> step-by-step fixes</span> you can follow—even if you've never written code.
          </p>
          <p>
            We know the specific security problems each AI builder creates. Lovable leaves databases wide open. 
            Bolt exposes secrets. Replit bypasses security checks. We check for all of them.
          </p>
          <p className="font-semibold text-gray-900 mt-6">
            The question isn't whether your app has problems. The question is: do you want to find them before they find you?
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-3xl p-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            The cost of waiting
          </h2>
          <div className="space-y-4 text-lg text-red-50 leading-relaxed">
            <p>
              Unchecked security problems lead to data leaks, <span className="font-semibold">exposed API keys causing thousands in unauthorized charges</span>, 
              database breaches, regulatory violations, and reputation damage.
            </p>
            <p>
              <span className="font-semibold">2,000+ vulnerable apps</span> have been identified in recent research. 
              Platforms like Lovable, Bolt, Replit, and Cursor all have documented security issues.
            </p>
            <p>
              Most founders spend $10K-$50K learning this the hard way after a security incident. 
              You can verify security for free, before you launch.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Find out what could go wrong before you launch
        </h2>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          You built something amazing. Don't let security problems you didn't know existed ruin your launch. 
          Get a free security check. See exactly what needs fixing. Get step-by-step instructions to fix it.
        </p>
        <p className="text-base text-gray-500 mb-8">
          No technical knowledge required. No credit card. Just enter your URL and get your report in minutes.
        </p>
        <button
          onClick={scrollToTop}
          className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold text-lg transition-colors shadow-lg"
        >
          Check My App Now →
        </button>
        <p className="text-sm text-gray-500 mt-4">
          100% free • No credit card • Results in minutes
        </p>
      </div>
    </div>
  );
}

