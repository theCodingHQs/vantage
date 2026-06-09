'use server'

import { createServerFn } from '@tanstack/react-start'

type EmailPayload = {
  to: string
  subject: string
  html: string
}

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY
  console.log(`\n[EMAIL DBG] sendEmail triggered.`)
  console.log(`[EMAIL DBG] RESEND_API_KEY exists: ${!!apiKey}`)
  console.log(`[EMAIL DBG] RESEND_API_KEY length: ${apiKey ? apiKey.length : 0}`)
  console.log(`[EMAIL DBG] RESEND_API_KEY prefix: ${apiKey ? apiKey.substring(0, 7) : 'none'}`)
  console.log(`[EMAIL DBG] Is mock key: ${apiKey ? apiKey.includes('mock_api_key') : true}`)

  if (!apiKey || apiKey.includes('mock_api_key')) {
    console.log('📬 [EMAIL MOCK SENT] (Due to mock API key)')
    console.log(`To: ${payload.to}`)
    console.log(`Subject: ${payload.subject}`)
    console.log('--- Body ---')
    console.log(payload.html.replace(/<[^>]*>/g, ' ')) // strip HTML for simple logs
    console.log('------------')
    return { success: true, mock: true }
  }

  try {
    console.log(`[EMAIL DBG] Attempting real Resend email transmission...`)
    console.log(
      `[EMAIL DBG] Sender (From): ${process.env.FROM_EMAIL || 'Vantage OS <no-reply@vantage.com>'}`
    )
    console.log(`[EMAIL DBG] Recipient (To): ${payload.to}`)
    console.log(`[EMAIL DBG] Subject: ${payload.subject}`)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'Vantage OS <no-reply@vantage.com>',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    })

    const responseText = await response.text()
    console.log(`[EMAIL DBG] Resend HTTP Status: ${response.status} ${response.statusText}`)
    console.log(`[EMAIL DBG] Resend Body Response: ${responseText}`)

    if (!response.ok) {
      throw new Error(`Resend API Error: ${responseText}`)
    }

    const data = JSON.parse(responseText)
    return { success: true, id: data.id }
  } catch (err: any) {
    console.error('❌ Failed to send email via Resend:', err.message)
    return { success: false, error: err.message }
  }
}

// Welcoming Onboarding Email Template
export const sendWelcomeEmail = createServerFn({ method: 'POST' })
  .validator((data: { toEmail: string; userName: string }) => data)
  .handler(async ({ data }) => {
    const { toEmail, userName } = data
    return sendEmail({
      to: toEmail,
      subject: 'Welcome to Vantage — Freelancer Operating System!',
      html: `
        <div style="font-family: sans-serif; background-color: #0a0a0f; color: #f1f5f9; padding: 40px; border-radius: 8px;">
          <h1 style="color: #6366f1;">Welcome to Vantage, ${userName}!</h1>
          <p>Your workspace is ready. You now have everything you need to run your freelance business professionally.</p>
          <p><strong>Onboarding Checklist:</strong></p>
          <ul>
            <li>Setup your business details & currency in Settings</li>
            <li>Log your first client in the CRM pipeline</li>
            <li>Create a project and start logging billable hours</li>
            <li>Send professional, branded invoices to clients</li>
          </ul>
          <p>Vantage gives you the edge. Let's make this year your most profitable one yet!</p>
          <p style="color: #94a3b8;">— The Vantage Team</p>
        </div>
      `,
    })
  })

// Invoice Email Template
export const sendInvoiceEmail = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      toEmail: string
      invoiceNum: string
      total: string
      clientName: string
      portalUrl: string
    }) => data
  )
  .handler(async ({ data }) => {
    const { toEmail, invoiceNum, total, clientName, portalUrl } = data
    return sendEmail({
      to: toEmail,
      subject: `New Invoice from Vantage: ${invoiceNum}`,
      html: `
        <div style="font-family: sans-serif; background-color: #0a0a0f; color: #f1f5f9; padding: 40px; border-radius: 8px;">
          <h2 style="color: #6366f1;">Hi ${clientName},</h2>
          <p>A new invoice has been generated for your recent project milestone.</p>
          <div style="background-color: #111118; border: 1px solid #2a2a35; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">Invoice Number</p>
            <p style="margin: 5px 0 15px 0; font-size: 18px; font-weight: bold; color: #f1f5f9;">${invoiceNum}</p>
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">Total Amount Due</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #10b981;">${total}</p>
          </div>
          <p>You can view the details and pay using the portal link below:</p>
          <a href="${portalUrl}" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 15px 0;">View & Pay Invoice</a>
          <p style="color: #94a3b8; font-size: 14px;">If you have any questions, please reply directly to this email.</p>
        </div>
      `,
    })
  })

// Proposal Email Template
export const sendProposalEmail = createServerFn({ method: 'POST' })
  .validator(
    (data: { toEmail: string; proposalTitle: string; clientName: string; proposalUrl: string }) =>
      data
  )
  .handler(async ({ data }) => {
    const { toEmail, proposalTitle, clientName, proposalUrl } = data
    return sendEmail({
      to: toEmail,
      subject: `Project Proposal: ${proposalTitle}`,
      html: `
        <div style="font-family: sans-serif; background-color: #0a0a0f; color: #f1f5f9; padding: 40px; border-radius: 8px;">
          <h2 style="color: #6366f1;">Hello ${clientName},</h2>
          <p>A project proposal has been drafted for your review. We've outlined the project goals, deliverables, timeline, and pricing breakdown.</p>
          <p>Click below to open the interactive proposal, accept, or leave feedback:</p>
          <a href="${proposalUrl}" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 15px 0;">Review & Sign Proposal</a>
          <p style="color: #94a3b8;">We look forward to working with you!</p>
        </div>
      `,
    })
  })
