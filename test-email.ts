#!/usr/bin/env tsx
/**
 * Test email sending with Resend
 * Run: npx tsx test-email.ts your-email@example.com
 */
import { sendTestEmail, sendAccessEmail } from './src/lib/email';

const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx test-email.ts <email>');
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.error('Error: RESEND_API_KEY not found in environment');
  process.exit(1);
}

async function main() {
  console.log(`Testing email to: ${email}`);
  console.log(`Using FROM_EMAIL: ${process.env.FROM_EMAIL || 'security@vibecodeaudit.app'}`);
  
  try {
    // Test 1: Simple test email
    console.log('\n1. Sending test email...');
    await sendTestEmail(email);
    console.log('✅ Test email sent successfully');

    // Test 2: Access email with mock data
    console.log('\n2. Sending access email with mock data...');
    await sendAccessEmail({
      email,
      jobId: 'test-job-123',
      accessToken: 'test-token-456',
      url: 'https://example.com',
      issuesFound: 5,
      criticalCount: 2,
    });
    console.log('✅ Access email sent successfully');

    console.log('\n✅ All emails sent successfully!');
    console.log('Check your inbox:', email);
  } catch (error) {
    console.error('\n❌ Error sending email:', error);
    process.exit(1);
  }
}

main();
