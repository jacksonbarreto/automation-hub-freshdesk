/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IFreshDeskTicketDetial {
    cc_emails: string[];
    fwd_emails: string[];
    reply_cc_emails: string[];
    ticket_cc_emails: string[];
    fr_escalated: boolean;
    spam: boolean;
    email_config_id: number;
    group_id: number | null;
    priority: number;
    requester_id: number;
    responder_id: number | null;
    source: number;
    company_id: number | null;
    status: number;
    subject: string;
    association_type: string | null;
    support_email: string;
    to_emails: string[];
    product_id: number | null;
    id: number;
    type: string | null;
    due_by: string; // Date string in ISO 8601 format
    fr_due_by: string; // Date string in ISO 8601 format
    is_escalated: boolean;
    description: string;
    description_text: string;
    custom_fields: Record<string, any>; // You can replace 'any' with specific types for custom fields if known
    created_at: string; // Date string in ISO 8601 format
    updated_at: string; // Date string in ISO 8601 format
    tags: string[];
    attachments: IFreshDeskTicketAttachment[];
    source_additional_info: string | null;
}

export interface IFreshDeskTicketAttachment {
    id: number;
    content_type: string;
    size: number;
    name: string;
    attachment_url: string;
    created_at: string; // Date string in ISO 8601 format
    updated_at: string; // Date string in ISO 8601 format
}