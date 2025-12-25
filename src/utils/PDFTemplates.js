export const invoiceTemplate = (data) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${data.name} - Invoice</title>
<style>
  * {
    box-sizing: border-box;
    font-family: "Segoe UI", Roboto, Arial, sans-serif;
  }

  body {
    background: #f4f6f8;
    padding: 30px;
  }

  .invoice-container {
    max-width: 800px;
    margin: auto;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  }

  .invoice-header {
    background: linear-gradient(135deg, #2563eb, #1e40af);
    color: #ffffff;
    padding: 24px;
  }

  .invoice-header h1 {
    margin: 0;
    font-size: 28px;
    letter-spacing: 1px;
  }

  .invoice-header p {
    margin: 4px 0 0;
    opacity: 0.9;
  }

  .invoice-body {
    padding: 24px;
  }

  .invoice-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .invoice-info div {
    font-size: 14px;
    color: #374151;
  }

  .invoice-info strong {
    display: block;
    color: #111827;
    margin-bottom: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
  }

  thead {
    background: #f1f5f9;
  }

  th {
    text-align: left;
    padding: 12px;
    font-size: 13px;
    text-transform: uppercase;
    color: #475569;
  }

  td {
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 14px;
    color: #111827;
  }

  tbody tr:hover {
    background: #f8fafc;
  }

  .text-right {
    text-align: right;
  }

  .total-section {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
  }

  .total-box {
    background: #f8fafc;
    padding: 16px 24px;
    border-radius: 10px;
    min-width: 260px;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .grand-total {
    font-size: 18px;
    font-weight: bold;
    color: #1e40af;
    border-top: 1px solid #e5e7eb;
    padding-top: 10px;
  }

  .invoice-footer {
    padding: 16px 24px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
    background: #f9fafb;
  }
</style>
</head>

<body>
  <div class="invoice-container">
    
    <!-- Header -->
    <div class="invoice-header">
      <h1>Invoice</h1>
      <p>Thank you for your business</p>
    </div>

    <!-- Body -->
    <div class="invoice-body">

      <!-- Info -->
      <div class="invoice-info">
        <div>
          <strong>Billed To</strong>
          ${data.name}
        </div>
        <div>
          <strong>Invoice Date</strong>
          ${data.date}
        </div>
      </div>

      <!-- Items Table -->
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          ${data.items
            .map(
              (i) => `
              <tr>
                <td>${i.name}</td>
                <td class="text-right">${i.qty}</td>
                <td class="text-right">₹${i.price}</td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>

      <!-- Total -->
      <div class="total-section">
        <div class="total-box">
          <div class="total-row">
            <span>Subtotal</span>
            <span>₹${data.total}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total</span>
            <span>₹${data.total}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      This is a system-generated invoice.
    </div>

  </div>
</body>
</html>
`;

export const employeeProfileTemplate = (data) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${data.name} - Employee Profile</title>
<style>
  @page {
    size: A4;
    margin: 0;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
    color: #2d3748;
    font-size: 11px;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: #ffffff;
    position: relative;
    overflow: hidden;
  }

  @media print {
    body {
      background: #ffffff;
    }
    .page {
      margin: 0;
    }
  }

  /* Decorative Elements */
  .page::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(50%, -50%);
  }

  .page::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 150px;
    height: 150px;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, 50%);
  }

  /* Header Section */
  .header {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
    padding: 30px 35px;
    position: relative;
    overflow: hidden;
  }

  .header::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 60%);
    border-radius: 50%;
  }

  .header::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: 10%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 60%);
    border-radius: 50%;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 25px;
    position: relative;
    z-index: 1;
  }

  .profile-image-wrapper {
    position: relative;
  }

  .profile-image {
    width: 100px;
    height: 100px;
    border-radius: 20px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    object-fit: cover;
    background: #ffffff;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  .status-indicator {
    position: absolute;
    bottom: 5px;
    right: 5px;
    width: 20px;
    height: 20px;
    background: ${data.isActive || data.is_active ? '#10b981' : '#ef4444'};
    border: 3px solid #1e1b4b;
    border-radius: 50%;
    box-shadow: 0 0 10px ${data.isActive || data.is_active ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
  }

  .header-info {
    flex: 1;
    color: #ffffff;
  }

  .employee-name {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
    background: linear-gradient(135deg, #ffffff 0%, #c7d2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .employee-role {
    font-size: 14px;
    color: #a5b4fc;
    font-weight: 500;
    margin-bottom: 8px;
    text-transform: capitalize;
  }

  .employee-meta {
    display: flex;
    gap: 20px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .meta-icon {
    opacity: 0.8;
  }

  .header-badges {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }

  .badge {
    padding: 6px 16px;
    border-radius: 30px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    backdrop-filter: blur(10px);
  }

  .badge-active {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
  }

  .badge-inactive {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: #ffffff;
  }

  .badge-type {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  /* Quick Stats Bar */
  .quick-stats {
    display: flex;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;
  }

  .stat-item {
    flex: 1;
    padding: 15px 20px;
    text-align: center;
    border-right: 1px solid #e2e8f0;
  }

  .stat-item:last-child {
    border-right: none;
  }

  .stat-value {
    font-size: 18px;
    font-weight: 800;
    color: #4338ca;
    margin-bottom: 2px;
  }

  .stat-label {
    font-size: 9px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }

  /* Content Area */
  .content {
    padding: 25px 35px;
    position: relative;
    z-index: 1;
  }

  /* Section Styles */
  .section {
    margin-bottom: 25px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f1f5f9;
  }

  .section-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
    border-radius: 10px;
    font-size: 16px;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  }

  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .section-line {
    flex: 1;
    height: 2px;
    background: linear-gradient(90deg, #e2e8f0 0%, transparent 100%);
  }

  /* Info Grid */
  .info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .info-grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid-4 {
    grid-template-columns: repeat(4, 1fr);
  }

  .info-item {
    background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
    padding: 12px 15px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    transition: all 0.3s ease;
  }

  .info-item:hover {
    border-color: #c7d2fe;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
  }

  .info-item.highlight {
    background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
    border-color: #c7d2fe;
  }

  .info-item.success {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border-color: #6ee7b7;
  }

  .info-item.warning {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border-color: #fcd34d;
  }

  .info-label {
    font-size: 9px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .info-value {
    font-size: 12px;
    color: #1e293b;
    font-weight: 600;
  }

  .info-value.large {
    font-size: 16px;
    font-weight: 800;
    color: #4338ca;
  }

  .info-value.money {
    color: #059669;
  }

  /* Address Cards */
  .address-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .address-card {
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 18px;
    position: relative;
    overflow: hidden;
  }

  .address-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #4338ca 0%, #6366f1 100%);
  }

  .address-type {
    font-size: 10px;
    color: #4338ca;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .address-type .same-tag {
    background: #ddd6fe;
    color: #5b21b6;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 8px;
  }

  .address-text {
    font-size: 11px;
    color: #475569;
    line-height: 1.7;
  }

  /* Table Styles */
  .modern-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 10px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }

  .modern-table thead {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  }

  .modern-table th {
    padding: 12px 15px;
    text-align: left;
    font-weight: 600;
    color: #ffffff;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .modern-table td {
    padding: 12px 15px;
    border-bottom: 1px solid #f1f5f9;
    color: #475569;
    background: #ffffff;
  }

  .modern-table tbody tr:last-child td {
    border-bottom: none;
  }

  .modern-table tbody tr:nth-child(even) td {
    background: #fafafa;
  }

  /* Skills Section */
  .skills-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .skill-tag {
    background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
    color: #ffffff;
    padding: 8px 16px;
    border-radius: 25px;
    font-size: 10px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    letter-spacing: 0.3px;
  }

  .skill-tag:nth-child(even) {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  }

  .skill-tag:nth-child(3n) {
    background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
  }

  /* Emergency Contacts */
  .emergency-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .emergency-card {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 1px solid #fbbf24;
    border-radius: 14px;
    padding: 15px;
    position: relative;
    overflow: hidden;
  }

  .emergency-card::before {
    content: '🚨';
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 20px;
    opacity: 0.3;
  }

  .emergency-name {
    font-weight: 700;
    color: #78350f;
    font-size: 13px;
    margin-bottom: 3px;
  }

  .emergency-relation {
    font-size: 9px;
    color: #92400e;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.5);
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    margin-bottom: 8px;
  }

  .emergency-contact {
    font-size: 11px;
    color: #78350f;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 4px;
  }

  /* Bank Details */
  .bank-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .bank-item {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    padding: 14px;
    border-radius: 12px;
    border-left: 4px solid #10b981;
  }

  .bank-item.full {
    grid-column: span 3;
  }

  .bank-label {
    font-size: 9px;
    color: #047857;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .bank-value {
    font-size: 12px;
    color: #065f46;
    font-weight: 700;
  }

  /* Document Grid */
  .doc-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .doc-item {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 18px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .doc-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #4338ca, #6366f1, #8b5cf6);
  }

  .doc-icon {
    font-size: 24px;
    margin-bottom: 8px;
    filter: grayscale(0.2);
  }

  .doc-label {
    font-size: 9px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    margin-bottom: 5px;
  }

  .doc-value {
    font-size: 12px;
    font-weight: 700;
    color: #1e293b;
    font-family: 'Courier New', monospace;
    letter-spacing: 1px;
  }

  /* Medical Card */
  .medical-card {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 1px solid #fca5a5;
    border-radius: 14px;
    padding: 18px;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 15px;
    align-items: start;
  }

  .blood-group-display {
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
    color: #ffffff;
    width: 60px;
    height: 60px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 800;
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
  }

  .medical-info h4 {
    font-size: 12px;
    color: #991b1b;
    margin-bottom: 8px;
    font-weight: 700;
  }

  .medical-conditions {
    font-size: 11px;
    color: #7f1d1d;
    line-height: 1.6;
    background: rgba(255, 255, 255, 0.5);
    padding: 10px;
    border-radius: 8px;
  }

  /* HR Notes */
  .notes-card {
    background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
    border: 1px solid #fde047;
    border-radius: 14px;
    padding: 18px;
    position: relative;
  }

  .notes-card::before {
    content: '📝';
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 24px;
    opacity: 0.3;
  }

  .notes-title {
    font-size: 11px;
    color: #854d0e;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
  }

  .notes-content {
    font-size: 11px;
    color: #713f12;
    line-height: 1.7;
  }

  /* Footer */
  .footer {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    padding: 20px 35px;
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 25px;
  }

  .footer-left {
    font-size: 9px;
    opacity: 0.7;
  }

  .footer-center {
    text-align: center;
  }

  .footer-logo {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 2px;
    opacity: 0.9;
  }

  .footer-tagline {
    font-size: 8px;
    opacity: 0.6;
    margin-top: 2px;
  }

  .footer-right {
    text-align: right;
    font-size: 9px;
    opacity: 0.7;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 30px;
    color: #94a3b8;
    font-size: 11px;
  }

  .empty-state-icon {
    font-size: 30px;
    margin-bottom: 10px;
    opacity: 0.5;
  }

  /* Page Break */
  .page-break {
    page-break-after: always;
  }

  /* Page Number */
  .page-number {
    position: absolute;
    bottom: 15px;
    right: 35px;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 600;
  }

  /* Divider */
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, #e2e8f0 20%, #e2e8f0 80%, transparent 100%);
    margin: 20px 0;
  }

  /* Two Column Layout */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  /* Compact Info Row */
  .compact-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
  }

  .compact-row:last-child {
    border-bottom: none;
  }

  .compact-label {
    font-size: 10px;
    color: #64748b;
    font-weight: 500;
  }

  .compact-value {
    font-size: 11px;
    color: #1e293b;
    font-weight: 600;
  }
</style>
</head>

<body>
  <!-- ==================== PAGE 1 ==================== -->
  <div class="page page-break">
    
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <div class="profile-image-wrapper">
          <img src="${data.employeeImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name) + '&background=4338ca&color=fff&size=256&bold=true'}" 
               alt="${data.name}" 
               class="profile-image" />
          <div class="status-indicator"></div>
        </div>
        <div class="header-info">
          <h1 class="employee-name">${data.name}</h1>
          <div class="employee-role">${data.role || 'Employee'}</div>
          <div class="employee-meta">
            <span class="meta-item">
              <span class="meta-icon">🆔</span>
              ${data.employeeId || 'N/A'}
            </span>
            <span class="meta-item">
              <span class="meta-icon">📧</span>
              ${data.email || 'N/A'}
            </span>
            <span class="meta-item">
              <span class="meta-icon">📱</span>
              ${data.phone_number || 'N/A'}
            </span>
          </div>
        </div>
        <div class="header-badges">
          <span class="badge ${data.isActive || data.is_active ? 'badge-active' : 'badge-inactive'}">${data.employmentStatus || (data.isActive || data.is_active ? 'Active' : 'Inactive')}</span>
          <span class="badge badge-type">${data.employmentType || 'Full-Time'}</span>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="stat-item">
        <div class="stat-value">${data.dateOfJoining ? Math.floor((new Date() - new Date(data.dateOfJoining)) / (1000 * 60 * 60 * 24 * 365)) : '0'}</div>
        <div class="stat-label">Years with Us</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.totalExperienceYears || '0'}</div>
        <div class="stat-label">Total Experience</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">₹${data.salary ? (data.salary / 1000).toFixed(0) + 'K' : 'N/A'}</div>
        <div class="stat-label">Monthly CTC</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.skills ? data.skills.length : 0}</div>
        <div class="stat-label">Skills</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.certifications ? data.certifications.length : 0}</div>
        <div class="stat-label">Certifications</div>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      
      <!-- Personal & Contact Information -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">👤</div>
          <h2 class="section-title">Personal Information</h2>
          <div class="section-line"></div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Full Name</div>
            <div class="info-value">${data.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date of Birth</div>
            <div class="info-value">${data.dob ? new Date(data.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Gender</div>
            <div class="info-value" style="text-transform: capitalize;">${data.gender || 'N/A'}</div>
          </div>
          <div class="info-item highlight">
            <div class="info-label">Blood Group</div>
            <div class="info-value" style="color: #dc2626; font-weight: 800;">${data.bloodGroup || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Nationality</div>
            <div class="info-value">${data.nationality || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Marital Status</div>
            <div class="info-value">${data.maritalStatus || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Primary Phone</div>
            <div class="info-value">${data.phone_number || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Secondary Phone</div>
            <div class="info-value">${data.secondary_phone_number || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">UPI ID</div>
            <div class="info-value">${data.upiId || 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Address Information -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">📍</div>
          <h2 class="section-title">Address Information</h2>
          <div class="section-line"></div>
        </div>
        <div class="address-grid">
          <div class="address-card">
            <div class="address-type">
              🏠 Permanent Address
            </div>
            <div class="address-text">
              ${data.permanentAddress ? `
                ${data.permanentAddress.line1 || ''}${data.permanentAddress.line2 ? ', ' + data.permanentAddress.line2 : ''}<br>
                ${data.permanentAddress.city || ''}${data.permanentAddress.state ? ', ' + data.permanentAddress.state : ''}<br>
                ${data.permanentAddress.country || ''} - ${data.permanentAddress.postalCode || ''}
              ` : 'Not provided'}
            </div>
          </div>
          <div class="address-card">
            <div class="address-type">
              📮 Current Address 
              ${data.sameAsPermanent ? '<span class="same-tag">Same as Permanent</span>' : ''}
            </div>
            <div class="address-text">
              ${data.currentAddress ? `
                ${data.currentAddress.line1 || ''}${data.currentAddress.line2 ? ', ' + data.currentAddress.line2 : ''}<br>
                ${data.currentAddress.city || ''}${data.currentAddress.state ? ', ' + data.currentAddress.state : ''}<br>
                ${data.currentAddress.country || ''} - ${data.currentAddress.postalCode || ''}
              ` : 'Not provided'}
            </div>
          </div>
        </div>
      </div>

      <!-- Identity Documents -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">📄</div>
          <h2 class="section-title">Identity Documents</h2>
          <div class="section-line"></div>
        </div>
        <div class="doc-grid">
          <div class="doc-item">
            <div class="doc-icon">🪪</div>
            <div class="doc-label">Aadhaar Number</div>
            <div class="doc-value">${data.aadhaarNumber ? data.aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3') : 'N/A'}</div>
          </div>
          <div class="doc-item">
            <div class="doc-icon">💳</div>
            <div class="doc-label">PAN Number</div>
            <div class="doc-value">${data.panNumber || 'N/A'}</div>
          </div>
          <div class="doc-item">
            <div class="doc-icon">🛂</div>
            <div class="doc-label">Passport Number</div>
            <div class="doc-value">${data.passportNumber || 'N/A'}</div>
          </div>
        </div>
      </div>

    </div>

    <!-- Footer Page 1 -->
    <div class="footer">
      <div class="footer-left">
        <div>Document ID: EMP-${data.employeeId || 'XXXX'}-${new Date().getFullYear()}</div>
        <div style="margin-top: 3px;">Registration: ${data.registration_date ? new Date(data.registration_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
      </div>
      <div class="footer-center">
        <div class="footer-logo">EMPLOYEE PROFILE</div>
        <div class="footer-tagline">Confidential HR Document</div>
      </div>
      <div class="footer-right">
        <div>Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        <div style="margin-top: 3px;">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div class="page-number">Page 1 of 3</div>
    </div>

  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page page-break">
    
    <!-- Mini Header -->
    <div class="header" style="padding: 20px 35px;">
      <div class="header-content">
        <div class="header-info">
          <h1 class="employee-name" style="font-size: 20px;">${data.name}</h1>
          <div class="employee-role" style="font-size: 12px;">${data.role || 'Employee'} • ID: ${data.employeeId || 'N/A'}</div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="content">

    
      <!-- Employment & Compensation -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">💼</div>
          <h2 class="section-title">Employment & Compensation</h2>
          <div class="section-line"></div>
        </div>
        <div class="info-grid info-grid-4">
          <div class="info-item highlight">
            <div class="info-label">Employee ID</div>
            <div class="info-value">${data.employeeId || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Designation</div>
            <div class="info-value" style="text-transform: capitalize;">${data.role || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date of Joining</div>
            <div class="info-value">${data.dateOfJoining ? new Date(data.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Employment Type</div>
            <div class="info-value">${data.employmentType || 'N/A'}</div>
          </div>
          <div class="info-item success">
            <div class="info-label">Monthly Salary</div>
            <div class="info-value large money">₹${data.salary ? data.salary.toLocaleString('en-IN') : 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Tax Status</div>
            <div class="info-value">${data.taxStatus || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">PF Number</div>
            <div class="info-value">${data.pfNumber || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">ESI Number</div>
            <div class="info-value">${data.esiNumber || 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Bank Details -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">🏦</div>
          <h2 class="section-title">Bank Account Details</h2>
          <div class="section-line"></div>
        </div>
        <div class="bank-grid">
          <div class="bank-item">
            <div class="bank-label">Account Holder Name</div>
            <div class="bank-value">${data.account_holder || 'N/A'}</div>
          </div>
          <div class="bank-item">
            <div class="bank-label">Account Number</div>
            <div class="bank-value">${data.account_number || 'N/A'}</div>
          </div>
          <div class="bank-item">
            <div class="bank-label">IFSC Code</div>
            <div class="bank-value">${data.ifsc_code || 'N/A'}</div>
          </div>
          <div class="bank-item">
            <div class="bank-label">Bank Name</div>
            <div class="bank-value">${data.bank_name || 'N/A'}</div>
          </div>
          <div class="bank-item" style="grid-column: span 2;">
            <div class="bank-label">Branch</div>
            <div class="bank-value">${data.branch_name || 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Skills -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">⚡</div>
          <h2 class="section-title">Skills & Expertise</h2>
          <div class="section-line"></div>
        </div>
        <div class="skills-container">
          ${data.skills && data.skills.length > 0 
            ? data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('') 
            : '<div class="empty-state"><div class="empty-state-icon">🎯</div>No skills listed</div>'}
        </div>
      </div>

      <!-- Education -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">🎓</div>
          <h2 class="section-title">Educational Background</h2>
          <div class="section-line"></div>
        </div>
        ${data.education && data.education.length > 0 ? `
        <table class="modern-table">
          <thead>
            <tr>
              <th>Qualification</th>
              <th>Institution</th>
              <th>Board/University</th>
              <th>Year</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            ${data.education.map(edu => `
            <tr>
              <td style="font-weight: 600;">${edu.qualification || 'N/A'}</td>
              <td>${edu.institution || 'N/A'}</td>
              <td>${edu.boardOrUniversity || 'N/A'}</td>
              <td>${edu.yearOfPassing || 'N/A'}</td>
              <td style="font-weight: 600; color: #4338ca;">${edu.percentageOrCgpa || 'N/A'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<div class="empty-state"><div class="empty-state-icon">📚</div>No education records available</div>'}
      </div>

    </div>

    <!-- Footer Page 2 -->
    <div class="footer">
      <div class="footer-left">
        <div>Document ID: EMP-${data.employeeId || 'XXXX'}-${new Date().getFullYear()}</div>
        <div style="margin-top: 3px;">Registration: ${data.registration_date ? new Date(data.registration_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
      </div>
      <div class="footer-center">
        <div class="footer-logo">EMPLOYEE PROFILE</div>
        <div class="footer-tagline">Confidential HR Document</div>
      </div>
      <div class="footer-right">
        <div>Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        <div style="margin-top: 3px;">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div class="page-number">Page 2 of 3</div>
    </div>

  </div>

  <!-- ==================== PAGE 3 ==================== -->
  <div class="page">
    
    <!-- Mini Header -->
    <div class="header" style="padding: 20px 35px;">
      <div class="header-content">
        <div class="header-info">
          <h1 class="employee-name" style="font-size: 20px;">${data.name}</h1>
          <div class="employee-role" style="font-size: 12px;">${data.role || 'Employee'} • ID: ${data.employeeId || 'N/A'}</div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="content">

      <!-- Experience -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">💼</div>
          <h2 class="section-title">Work Experience</h2>
          <div class="section-line"></div>
        </div>
        ${data.experience && data.experience.length > 0 ? `
        <table class="modern-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Position</th>
              <th>Duration</th>
              <th>Last CTC</th>
              <th>Key Responsibilities</th>
            </tr>
          </thead>
          <tbody>
            ${data.experience.map(exp => `
            <tr>
              <td style="font-weight: 600;">${exp.companyName || 'N/A'}</td>
              <td>${exp.title || 'N/A'}</td>
              <td>${exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''} - ${exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Present'}</td>
              <td style="color: #059669; font-weight: 600;">₹${exp.lastDrawnSalary ? exp.lastDrawnSalary.toLocaleString('en-IN') : 'N/A'}</td>
              <td style="max-width: 180px; font-size: 9px;">${exp.responsibilities || 'N/A'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<div class="empty-state"><div class="empty-state-icon">💼</div>No work experience records</div>'}
      </div>

      <!-- Certifications -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon">🏆</div>
          <h2 class="section-title">Certifications & Achievements</h2>
          <div class="section-line"></div>
        </div>
        ${data.certifications && data.certifications.length > 0 ? `
        <table class="modern-table">
          <thead>
            <tr>
              <th>Certificate Title</th>
              <th>Issuing Organization</th>
              <th>Issue Date</th>
              <th>Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.certifications.map(cert => `
            <tr>
              <td style="font-weight: 600;">${cert.title || 'N/A'}</td>
              <td>${cert.issuer || 'N/A'}</td>
              <td>${cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
              <td>${cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Expiry'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<div class="empty-state"><div class="empty-state-icon">🏅</div>No certifications available</div>'}
      </div>

      <!-- Emergency Contacts & Medical -->
      <div class="two-col">
        <div class="section" style="margin-bottom: 0;">
          <div class="section-header">
            <div class="section-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">🚨</div>
            <h2 class="section-title">Emergency Contacts</h2>
          </div>
          ${data.emergencyContacts && data.emergencyContacts.length > 0 
            ? `<div class="emergency-grid" style="grid-template-columns: 1fr;">
                ${data.emergencyContacts.map(contact => `
                <div class="emergency-card">
                  <div class="emergency-name">${contact.name || 'N/A'}</div>
                  <div class="emergency-relation">${contact.relationship || 'N/A'}</div>
                  <div class="emergency-contact">📱 ${contact.phone || 'N/A'}</div>
                  ${contact.alternatePhone ? `<div class="emergency-contact">📞 ${contact.alternatePhone}</div>` : ''}
                  ${contact.address ? `<div class="emergency-contact" style="font-size: 9px; align-items: flex-start;">📍 ${contact.address}</div>` : ''}
                </div>
                `).join('')}
              </div>`
            : '<div class="empty-state"><div class="empty-state-icon">👥</div>No emergency contacts</div>'}
        </div>

        <div class="section" style="margin-bottom: 0;">
          <div class="section-header">
            <div class="section-icon" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);">🏥</div>
            <h2 class="section-title">Medical Information</h2>
          </div>
          <div class="medical-card">
            <div class="blood-group-display">${data.bloodGroup || '?'}</div>
            <div class="medical-info">
              <h4>Medical Conditions & Allergies</h4>
              <div class="medical-conditions">
                ${data.medicalConditions || 'No medical conditions or allergies reported'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- HR Notes -->
      ${data.hrNotes ? `
      <div class="section" style="margin-top: 25px;">
        <div class="section-header">
          <div class="section-icon" style="background: linear-gradient(135deg, #ca8a04 0%, #a16207 100%); box-shadow: 0 4px 15px rgba(202, 138, 4, 0.3);">📝</div>
          <h2 class="section-title">HR Notes</h2>
          <div class="section-line"></div>
        </div>
        <div class="notes-card">
          <div class="notes-title">Internal Notes (Confidential)</div>
          <div class="notes-content">${data.hrNotes}</div>
        </div>
      </div>
      ` : ''}

    </div>

    <!-- Footer Page 3 -->
    <div class="footer">
      <div class="footer-left">
        <div>Document ID: EMP-${data.employeeId || 'XXXX'}-${new Date().getFullYear()}</div>
        <div style="margin-top: 3px;">Registration: ${data.registration_date ? new Date(data.registration_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
      </div>
      <div class="footer-center">
        <div class="footer-logo">EMPLOYEE PROFILE</div>
        <div class="footer-tagline">Confidential HR Document - End of Report</div>
      </div>
      <div class="footer-right">
        <div>Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        <div style="margin-top: 3px;">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div class="page-number">Page 3 of 3</div>
    </div>

  </div>

</body>
</html>
`;

export const transactionReportTemplate = (data) => {
  // Parse data if it's a string
  const transactions = typeof data === 'string' ? JSON.parse(data) : data;

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Generate Serial Numbers
  let serialNo = 0;

  // Calculate summary statistics
  const summary = {
    total: transactions.length,
    completed: transactions.filter(t => t.transaction_status === 'completed').length,
    rejected: transactions.filter(t => t.transaction_status === 'rejected').length,
    pending: transactions.filter(t => t.transaction_status === 'pending').length,
    deposits: transactions.filter(t => t.transaction_type === 'deposit').length,
    withdrawals: transactions.filter(t => t.transaction_type === 'withdraw').length,
    sells: transactions.filter(t => t.transaction_type === 'sell').length,
    totalAmount: transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0),
    completedAmount: transactions
      .filter(t => t.transaction_status === 'completed')
      .reduce((sum, t) => sum + (t.total_amount || 0), 0),
    depositAmount: transactions
      .filter(t => t.transaction_type === 'deposit' && t.transaction_status === 'completed')
      .reduce((sum, t) => sum + (t.total_amount || 0), 0),
    withdrawAmount: transactions
      .filter(t => t.transaction_type === 'withdraw' && t.transaction_status === 'completed')
      .reduce((sum, t) => sum + (t.total_amount || 0), 0),
    sellAmount: transactions
      .filter(t => t.transaction_type === 'sell' && t.transaction_status === 'completed')
      .reduce((sum, t) => sum + (t.total_amount || 0), 0),
    totalQuantity: transactions.reduce((sum, t) => {
      return sum + (t.grain?.reduce((gs, g) => gs + (g.quantity_quintal || 0), 0) || 0);
    }, 0)
  };

  // Get date range
  const dates = transactions.map(t => new Date(t.transaction_date)).filter(d => !isNaN(d));
  const minDate = dates.length ? new Date(Math.min(...dates)) : new Date();
  const maxDate = dates.length ? new Date(Math.max(...dates)) : new Date();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Transaction Report - Official Copy</title>
  <style>
    /* A4 Page Setup */
    @page {
      size: A4 landscape;
      margin: 8mm 10mm;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-after: always;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 9pt;
      line-height: 1.3;
      color: #000000;
      background: #ffffff;
      padding: 5mm;
    }

    /* Header Styles */
    .letterhead {
      border-bottom: 3px double #000;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }

    .letterhead-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .org-info {
      text-align: center;
      flex: 1;
    }

    .org-logo {
      font-size: 36pt;
      margin-bottom: 5px;
    }

    .org-name {
      font-size: 18pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 3px;
    }

    .org-subtitle {
      font-size: 11pt;
      font-style: italic;
      color: #333;
    }

    .org-address {
      font-size: 9pt;
      color: #555;
      margin-top: 5px;
    }

    .doc-info {
      text-align: right;
      font-size: 9pt;
      min-width: 150px;
    }

    .doc-info table {
      margin-left: auto;
    }

    .doc-info td {
      padding: 2px 5px;
      text-align: left;
    }

    .doc-info td:first-child {
      font-weight: bold;
      text-align: right;
    }

    /* Report Title */
    .report-title {
      text-align: center;
      margin: 15px 0;
      padding: 8px 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }

    .report-title h1 {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin: 0;
    }

    .report-title .subtitle {
      font-size: 10pt;
      color: #333;
      margin-top: 3px;
    }

    /* Summary Box */
    .summary-section {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }

    .summary-box {
      flex: 1;
      border: 1px solid #000;
      padding: 10px;
    }

    .summary-box h3 {
      font-size: 10pt;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }

    .summary-table {
      width: 100%;
    }

    .summary-table td {
      padding: 3px 5px;
      font-size: 9pt;
    }

    .summary-table td:last-child {
      text-align: right;
      font-weight: bold;
    }

    .summary-table tr.total-row {
      border-top: 1px solid #000;
      font-weight: bold;
    }

    .summary-table tr.total-row td {
      padding-top: 5px;
    }

    /* Main Table */
    .data-table-container {
      margin: 15px 0;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }

    .data-table th,
    .data-table td {
      border: 1px solid #000;
      padding: 4px 5px;
      vertical-align: middle;
    }

    .data-table thead {
      background: #f0f0f0;
    }

    .data-table thead th {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 7pt;
      text-align: center;
      vertical-align: middle;
    }

    .data-table thead th.rotated {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transform: rotate(180deg);
      height: 80px;
      width: 25px;
      padding: 5px 2px;
    }

    .data-table tbody tr:nth-child(even) {
      background: #fafafa;
    }

    .data-table tbody tr:hover {
      background: #ffffcc;
    }

    .data-table td.center {
      text-align: center;
    }

    .data-table td.right {
      text-align: right;
    }

    .data-table td.nowrap {
      white-space: nowrap;
    }

    .data-table td.amount {
      text-align: right;
      font-family: 'Courier New', monospace;
    }

    .data-table tfoot {
      background: #e8e8e8;
      font-weight: bold;
    }

    .data-table tfoot td {
      padding: 6px 5px;
    }

    /* Status Styles */
    .status {
      display: inline-block;
      padding: 2px 6px;
      font-size: 7pt;
      font-weight: bold;
      text-transform: uppercase;
      border-radius: 2px;
    }

    .status.completed {
      background: #c8e6c9;
      color: #2e7d32;
      border: 1px solid #2e7d32;
    }

    .status.pending {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #856404;
    }

    .status.rejected {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #721c24;
    }

    /* Type Styles */
    .type {
      display: inline-block;
      padding: 2px 6px;
      font-size: 7pt;
      font-weight: bold;
      text-transform: uppercase;
    }

    .type.deposit {
      background: #e3f2fd;
      color: #1565c0;
    }

    .type.withdraw {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .type.sell {
      background: #fce4ec;
      color: #c2185b;
    }

    /* Approval Indicators */
    .approval-cell {
      font-size: 10pt;
      text-align: center;
    }

    .approved {
      color: #2e7d32;
    }

    .not-approved {
      color: #d32f2f;
    }

    .pending-approval {
      color: #f57c00;
    }

    /* Footer Section */
    .footer-section {
      margin-top: 20px;
      page-break-inside: avoid;
    }

    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #000;
    }

    .signature-box {
      text-align: center;
      width: 200px;
    }

    .signature-line {
      border-top: 1px solid #000;
      margin-top: 50px;
      padding-top: 5px;
    }

    .signature-box .title {
      font-weight: bold;
      font-size: 9pt;
    }

    .signature-box .subtitle {
      font-size: 8pt;
      color: #666;
    }

    /* Certification Box */
    .certification {
      border: 2px solid #000;
      padding: 15px;
      margin-top: 20px;
      background: #fafafa;
    }

    .certification h4 {
      font-size: 10pt;
      text-transform: uppercase;
      margin-bottom: 10px;
      text-align: center;
    }

    .certification p {
      font-size: 9pt;
      text-align: justify;
      line-height: 1.5;
    }

    /* Notes Section */
    .notes-section {
      margin-top: 15px;
      padding: 10px;
      border: 1px solid #ccc;
      background: #f9f9f9;
    }

    .notes-section h4 {
      font-size: 9pt;
      margin-bottom: 5px;
    }

    .notes-section ul {
      font-size: 8pt;
      margin-left: 15px;
    }

    .notes-section li {
      margin-bottom: 3px;
    }

    /* Stamp Area */
    .stamp-area {
      width: 120px;
      height: 120px;
      border: 2px dashed #999;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 8pt;
      text-align: center;
    }

    /* Page Number */
    .page-number {
      text-align: center;
      font-size: 8pt;
      color: #666;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #ccc;
    }

    /* Grain sub-row */
    .grain-details {
      font-size: 7pt;
      color: #444;
    }

    .grain-row {
      border-top: 1px dashed #ccc;
      padding-top: 2px;
      margin-top: 2px;
    }

    .txn-id {
      font-family: 'Courier New', monospace;
      font-size: 7pt;
      color: #666;
    }

    /* Quality Badge */
    .quality {
      display: inline-block;
      width: 18px;
      height: 18px;
      line-height: 18px;
      text-align: center;
      border-radius: 50%;
      font-weight: bold;
      font-size: 8pt;
    }

    .quality.A {
      background: #c8e6c9;
      color: #2e7d32;
    }

    .quality.B {
      background: #fff3cd;
      color: #856404;
    }

    .quality.C {
      background: #f8d7da;
      color: #721c24;
    }

    /* Portrait alternative for detailed view */
    @media print {
      .portrait-page {
        size: A4 portrait;
      }
    }
  </style>
</head>

<body>

  <!-- Letterhead -->
  <div class="letterhead">
    <div class="letterhead-top">
      <div style="width: 100px;"></div>
      <div class="org-info">
        <div class="org-logo">🏛️</div>
        <div class="org-name">Grain Bank Management System</div>
        <div class="org-subtitle">State Agricultural Warehousing Corporation</div>
        <div class="org-address">
          Head Office: Agriculture Bhawan, Lucknow, Uttar Pradesh - 226001<br>
          Tel: 0522-2234567 | Email: info@grainbank.gov.in | CIN: U01100UP2020SGC000001
        </div>
      </div>
      <div class="doc-info">
        <table>
          <tr>
            <td>Report No:</td>
            <td>GBMS/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}</td>
          </tr>
          <tr>
            <td>Date:</td>
            <td>${formatDate(new Date())}</td>
          </tr>
          <tr>
            <td>Time:</td>
            <td>${formatTime(new Date())}</td>
          </tr>
          <tr>
            <td>Page:</td>
            <td>1 of 1</td>
          </tr>
        </table>
      </div>
    </div>
  </div>

  <!-- Report Title -->
  <div class="report-title">
    <h1>Transaction Register Report</h1>
    <div class="subtitle">
      Period: ${formatDate(minDate)} to ${formatDate(maxDate)} | Generated by: System Administrator
    </div>
  </div>

  <!-- Summary Section -->
  <div class="summary-section">
    <div class="summary-box">
      <h3>📊 Transaction Summary</h3>
      <table class="summary-table">
        <tr>
          <td>Total Transactions</td>
          <td>${summary.total}</td>
        </tr>
        <tr>
          <td>Completed</td>
          <td style="color: green;">${summary.completed}</td>
        </tr>
        <tr>
          <td>Pending</td>
          <td style="color: orange;">${summary.pending}</td>
        </tr>
        <tr>
          <td>Rejected</td>
          <td style="color: red;">${summary.rejected}</td>
        </tr>
      </table>
    </div>

    <div class="summary-box">
      <h3>📦 Type-wise Breakdown</h3>
      <table class="summary-table">
        <tr>
          <td>Deposits</td>
          <td>${summary.deposits}</td>
          <td>₹ ${formatCurrency(summary.depositAmount)}</td>
        </tr>
        <tr>
          <td>Withdrawals</td>
          <td>${summary.withdrawals}</td>
          <td>₹ ${formatCurrency(summary.withdrawAmount)}</td>
        </tr>
        <tr>
          <td>Sales</td>
          <td>${summary.sells}</td>
          <td>₹ ${formatCurrency(summary.sellAmount)}</td>
        </tr>
        <tr class="total-row">
          <td>Total</td>
          <td>${summary.total}</td>
          <td>₹ ${formatCurrency(summary.completedAmount)}</td>
        </tr>
      </table>
    </div>

    <div class="summary-box">
      <h3>💰 Financial Summary</h3>
      <table class="summary-table">
        <tr>
          <td>Total Quantity</td>
          <td>${formatCurrency(summary.totalQuantity)} Qtl</td>
        </tr>
        <tr>
          <td>Gross Amount</td>
          <td>₹ ${formatCurrency(summary.totalAmount)}</td>
        </tr>
        <tr>
          <td>Completed Value</td>
          <td>₹ ${formatCurrency(summary.completedAmount)}</td>
        </tr>
        <tr class="total-row">
          <td>Net Processed</td>
          <td>₹ ${formatCurrency(summary.completedAmount)}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Main Data Table -->
  <div class="data-table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 25px;">S.No</th>
          <th rowspan="2" style="width: 70px;">Txn ID</th>
          <th rowspan="2" style="width: 65px;">Date</th>
          <th rowspan="2" style="width: 45px;">Type</th>
          <th colspan="3" style="background: #e3f2fd;">User Details</th>
          <th colspan="2" style="background: #fff3e0;">Warehouse</th>
          <th colspan="5" style="background: #f3e5f5;">Grain Details</th>
          <th rowspan="2" style="width: 70px;">Amount (₹)</th>
          <th rowspan="2" style="width: 55px;">Status</th>
          <th colspan="3" style="background: #e8f5e9;">Approvals</th>
          <th rowspan="2" style="width: 80px;">Remarks</th>
        </tr>
        <tr>
          <th style="width: 70px; background: #e3f2fd;">Farmer ID</th>
          <th style="width: 90px; background: #e3f2fd;">Name</th>
          <th style="width: 80px; background: #e3f2fd;">Contact</th>
          <th style="width: 80px; background: #fff3e0;">Name</th>
          <th style="width: 70px; background: #fff3e0;">Location</th>
          <th style="width: 50px; background: #f3e5f5;">Grain</th>
          <th style="width: 25px; background: #f3e5f5;">Qty</th>
          <th style="width: 20px; background: #f3e5f5;">Q</th>
          <th style="width: 45px; background: #f3e5f5;">Rate</th>
          <th style="width: 30px; background: #f3e5f5;">M%</th>
          <th class="rotated" style="background: #e8f5e9;">Admin</th>
          <th class="rotated" style="background: #e8f5e9;">Manager</th>
          <th class="rotated" style="background: #e8f5e9;">Supervisor</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map((t, index) => {
          serialNo++;
          const grainCount = t.grain?.length || 1;
          
          return t.grain?.map((g, gIndex) => `
            <tr>
              ${gIndex === 0 ? `
                <td class="center" rowspan="${grainCount}">${serialNo}</td>
                <td class="nowrap" rowspan="${grainCount}">
                  <span class="txn-id">${t._id?.slice(-8)?.toUpperCase() || '-'}</span>
                </td>
                <td class="center nowrap" rowspan="${grainCount}">
                  ${formatDate(t.transaction_date)}<br>
                  <small style="color: #666;">${formatTime(t.transaction_date)}</small>
                </td>
                <td class="center" rowspan="${grainCount}">
                  <span class="type ${t.transaction_type}">${t.transaction_type?.charAt(0).toUpperCase() + t.transaction_type?.slice(1, 3)}</span>
                </td>
                <td class="nowrap" rowspan="${grainCount}">
                  <small>${t.user_id?.farmerProfile?.farmerId || '-'}</small>
                </td>
                <td rowspan="${grainCount}">${t.user_id?.name || '-'}</td>
                <td class="nowrap" rowspan="${grainCount}">
                  <small>${t.user_id?.phone_number || '-'}</small>
                </td>
                <td rowspan="${grainCount}">${t.warehouse_id?.name || '-'}</td>
                <td rowspan="${grainCount}">${t.warehouse_id?.location || '-'}</td>
              ` : ''}
              <td>${g.category_id?.grain_type || '-'}</td>
              <td class="right">${g.quantity_quintal || 0}</td>
              <td class="center">
                <span class="quality ${g.category_id?.quality || ''}">${g.category_id?.quality || '-'}</span>
              </td>
              <td class="right amount">${formatCurrency(g.price_per_quintal)}</td>
              <td class="center">${g.moisture_content || '-'}</td>
              ${gIndex === 0 ? `
                <td class="amount" rowspan="${grainCount}">
                  <strong>${formatCurrency(t.total_amount)}</strong>
                </td>
                <td class="center" rowspan="${grainCount}">
                  <span class="status ${t.transaction_status}">${t.transaction_status?.charAt(0).toUpperCase() + t.transaction_status?.slice(1, 4)}</span>
                </td>
                <td class="center approval-cell" rowspan="${grainCount}">
                  ${t.approval_status?.admin_approval?.status 
                    ? '<span class="approved">✓</span>' 
                    : t.approval_status?.admin_approval?.status === false && t.approval_status?.admin_approval?.date
                      ? '<span class="not-approved">✗</span>'
                      : '<span class="pending-approval">○</span>'
                  }
                </td>
                <td class="center approval-cell" rowspan="${grainCount}">
                  ${t.approval_status?.manager_approval?.status 
                    ? '<span class="approved">✓</span>' 
                    : '<span class="pending-approval">○</span>'
                  }
                </td>
                <td class="center approval-cell" rowspan="${grainCount}">
                  ${t.approval_status?.supervisor_approval?.status 
                    ? '<span class="approved">✓</span>' 
                    : '<span class="pending-approval">○</span>'
                  }
                </td>
                <td rowspan="${grainCount}">
                  <small>${t.remarks || '-'}</small>
                </td>
              ` : ''}
            </tr>
          `).join('') || `
            <tr>
              <td class="center">${serialNo}</td>
              <td class="nowrap"><span class="txn-id">${t._id?.slice(-8)?.toUpperCase() || '-'}</span></td>
              <td class="center nowrap">${formatDate(t.transaction_date)}<br><small>${formatTime(t.transaction_date)}</small></td>
              <td class="center"><span class="type ${t.transaction_type}">${t.transaction_type?.charAt(0).toUpperCase() + t.transaction_type?.slice(1, 3)}</span></td>
              <td class="nowrap"><small>${t.user_id?.farmerProfile?.farmerId || '-'}</small></td>
              <td>${t.user_id?.name || '-'}</td>
              <td class="nowrap"><small>${t.user_id?.phone_number || '-'}</small></td>
              <td>${t.warehouse_id?.name || '-'}</td>
              <td>${t.warehouse_id?.location || '-'}</td>
              <td colspan="5" class="center">No grain data</td>
              <td class="amount"><strong>${formatCurrency(t.total_amount)}</strong></td>
              <td class="center"><span class="status ${t.transaction_status}">${t.transaction_status?.charAt(0).toUpperCase() + t.transaction_status?.slice(1, 4)}</span></td>
              <td class="center approval-cell">${t.approval_status?.admin_approval?.status ? '<span class="approved">✓</span>' : '<span class="pending-approval">○</span>'}</td>
              <td class="center approval-cell">${t.approval_status?.manager_approval?.status ? '<span class="approved">✓</span>' : '<span class="pending-approval">○</span>'}</td>
              <td class="center approval-cell">${t.approval_status?.supervisor_approval?.status ? '<span class="approved">✓</span>' : '<span class="pending-approval">○</span>'}</td>
              <td><small>${t.remarks || '-'}</small></td>
            </tr>
          `;
        }).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="10" class="right"><strong>GRAND TOTAL:</strong></td>
          <td class="right"><strong>${formatCurrency(summary.totalQuantity)}</strong></td>
          <td colspan="3"></td>
          <td class="amount"><strong>₹ ${formatCurrency(summary.completedAmount)}</strong></td>
          <td colspan="5"></td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Notes Section -->
  <div class="notes-section">
    <h4>📝 Legend & Notes:</h4>
    <ul>
      <li><strong>Type:</strong> Dep = Deposit | Wit = Withdraw | Sel = Sell</li>
      <li><strong>Q (Quality Grade):</strong> A = Premium | B = Standard | C = Economy</li>
      <li><strong>M% (Moisture):</strong> Moisture content percentage at the time of transaction</li>
      <li><strong>Approvals:</strong> ✓ = Approved | ✗ = Rejected | ○ = Pending</li>
      <li><strong>Status:</strong> Comp = Completed | Pend = Pending | Reje = Rejected</li>
    </ul>
  </div>

  <!-- Footer Section -->
  <div class="footer-section">
    
    <!-- Certification -->
    <div class="certification">
      <h4>Certificate of Authenticity</h4>
      <p>
        This is to certify that the above transaction report containing <strong>${summary.total}</strong> transaction(s) 
        with a total value of <strong>₹ ${formatCurrency(summary.completedAmount)}</strong> has been generated from the 
        official Grain Bank Management System database. The information presented herein is accurate and complete 
        to the best of our knowledge as of the date of generation. This report is system-generated and serves as 
        an official record for all administrative and audit purposes.
      </p>
    </div>

    <!-- Signature Section -->
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line">
          <div class="title">Prepared By</div>
          <div class="subtitle">Data Entry Operator</div>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-line">
          <div class="title">Verified By</div>
          <div class="subtitle">Warehouse Manager</div>
        </div>
      </div>
      <div class="stamp-area">
        <span>OFFICIAL<br>STAMP<br>HERE</span>
      </div>
      <div class="signature-box">
        <div class="signature-line">
          <div class="title">Approved By</div>
          <div class="subtitle">District Administrator</div>
        </div>
      </div>
    </div>

  </div>

  <!-- Page Number -->
  <div class="page-number">
    Page 1 of 1 | Report ID: GBMS/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 10000)).padStart(5, '0')} | 
    Generated: ${formatDate(new Date())} ${formatTime(new Date())} | 
    © ${new Date().getFullYear()} Grain Bank Management System - Government of India
  </div>

</body>
</html>
  `;
};

export const transactionInvoiceTemplate = (data) => {
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Number to words converter (Indian format)
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
    return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
  };

  // Generate invoice number
  const invoiceNo = `INV-${data.transaction_type?.toUpperCase().slice(0, 3) || 'TXN'}-${data._id?.slice(-8)?.toUpperCase() || 'XXXXXXXX'}`;

  // Transaction type info
  const getTypeInfo = (type) => {
    const types = {
      deposit: { label: 'DEPOSIT', color: '#059669', bg: '#ECFDF5', icon: '↓' },
      withdraw: { label: 'WITHDRAWAL', color: '#7C3AED', bg: '#F5F3FF', icon: '↑' },
      sell: { label: 'SALE', color: '#DC2626', bg: '#FEF2F2', icon: '₹' }
    };
    return types[type] || { label: 'TRANSACTION', color: '#1a365d', bg: '#F7FAFC', icon: '•' };
  };

  const txnInfo = getTypeInfo(data.transaction_type);
  const totalQuantity = data.grain?.reduce((sum, g) => sum + (g.quantity_quintal || 0), 0) || 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice - ${invoiceNo}</title>
  <style>
    @page {
      size: A4;
      margin: 10mm;
    }

    @media print {
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #333;
      background: #f5f5f5;
    }

    .invoice {
      width: 210mm;
      min-height: 297mm;
      max-height: 297mm;
      margin: 0 auto;
      background: #fff;
      padding: 15mm;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 15px;
      border-bottom: 3px solid ${txnInfo.color};
      margin-bottom: 15px;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, ${txnInfo.color}, ${txnInfo.color}dd);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 24px;
      font-weight: bold;
    }

    .company-name {
      font-size: 20px;
      font-weight: 700;
      color: #1a365d;
    }

    .company-subtitle {
      font-size: 10px;
      color: #666;
    }

    .invoice-title {
      text-align: right;
    }

    .invoice-label {
      font-size: 28px;
      font-weight: 700;
      color: ${txnInfo.color};
      letter-spacing: 2px;
    }

    .invoice-type {
      display: inline-block;
      background: ${txnInfo.bg};
      color: ${txnInfo.color};
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      margin-top: 5px;
    }

    /* Info Row */
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      gap: 20px;
    }

    .info-box {
      flex: 1;
      padding: 12px;
      background: #f8fafc;
      border-radius: 6px;
      border-left: 3px solid ${txnInfo.color};
    }

    .info-box.warehouse {
      border-left-color: #38a169;
      background: #f0fff4;
    }

    .info-label {
      font-size: 9px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .info-value {
      font-size: 12px;
      font-weight: 600;
      color: #1a365d;
    }

    .info-sub {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }

    /* Meta Info */
    .meta-row {
      display: flex;
      justify-content: space-between;
      background: #1a365d;
      color: #fff;
      padding: 10px 15px;
      border-radius: 6px;
      margin-bottom: 15px;
    }

    .meta-item {
      text-align: center;
    }

    .meta-label {
      font-size: 8px;
      opacity: 0.8;
      text-transform: uppercase;
    }

    .meta-value {
      font-size: 11px;
      font-weight: 600;
    }

    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
    }

    .status-completed { background: #c6f6d5; color: #22543d; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-rejected { background: #fed7d7; color: #9b2c2c; }

    /* Table */
    .table-section {
      margin-bottom: 15px;
    }

    .table-header {
      background: #1a365d;
      color: #fff;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 6px 6px 0 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    table th {
      background: #e2e8f0;
      padding: 10px 8px;
      text-align: left;
      font-size: 9px;
      font-weight: 600;
      color: #4a5568;
      text-transform: uppercase;
      border-bottom: 2px solid #cbd5e0;
    }

    table td {
      padding: 10px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }

    table tr:nth-child(even) {
      background: #f7fafc;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }

    .quality-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: 600;
    }

    .quality-A { background: #c6f6d5; color: #22543d; }
    .quality-B { background: #fef3c7; color: #92400e; }
    .quality-C { background: #fed7d7; color: #9b2c2c; }

    /* Totals */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 15px;
    }

    .totals-box {
      width: 280px;
      border: 2px solid ${txnInfo.color};
      border-radius: 8px;
      overflow: hidden;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 15px;
      border-bottom: 1px solid #e2e8f0;
    }

    .total-row:last-child {
      border-bottom: none;
      background: ${txnInfo.bg};
    }

    .total-label {
      color: #4a5568;
      font-size: 11px;
    }

    .total-value {
      font-weight: 600;
      font-size: 11px;
    }

    .grand-total {
      font-size: 16px !important;
      color: ${txnInfo.color} !important;
    }

    .amount-words {
      background: #f7fafc;
      padding: 10px 15px;
      border-radius: 6px;
      margin-bottom: 15px;
      font-size: 10px;
      color: #4a5568;
      border-left: 3px solid ${txnInfo.color};
    }

    .amount-words strong {
      color: #1a365d;
    }

    /* Approval Section */
    .approval-section {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }

    .approval-box {
      flex: 1;
      text-align: center;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .approval-box.approved { background: #f0fff4; border-color: #68d391; }
    .approval-box.pending { background: #fffaf0; border-color: #ed8936; }

    .approval-role {
      font-size: 8px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 3px;
    }

    .approval-icon {
      font-size: 18px;
      margin-bottom: 3px;
    }

    .approval-name {
      font-size: 10px;
      font-weight: 600;
      color: #1a365d;
    }

    .approval-date {
      font-size: 8px;
      color: #888;
    }

    /* Signatures */
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px dashed #cbd5e0;
    }

    .signature-box {
      text-align: center;
      width: 30%;
    }

    .signature-line {
      border-bottom: 1px solid #333;
      height: 40px;
      margin-bottom: 5px;
    }

    .signature-title {
      font-size: 10px;
      font-weight: 600;
      color: #1a365d;
    }

    .signature-subtitle {
      font-size: 8px;
      color: #888;
    }

    .stamp {
      width: 60px;
      height: 60px;
      border: 2px dashed #a0aec0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      font-size: 8px;
      color: #a0aec0;
      text-align: center;
    }

    /* Footer */
    .footer {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 2px solid #1a365d;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
      color: #888;
    }

    .footer-left {
      display: flex;
      gap: 15px;
    }

    .footer-center {
      text-align: center;
    }

    .footer-right {
      text-align: right;
    }

    .terms {
      background: #fffaf0;
      border: 1px solid #ed8936;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 10px;
      font-size: 8px;
      color: #744210;
    }

    .terms-title {
      font-weight: 600;
      margin-bottom: 3px;
    }
  </style>
</head>
<body>
  <div class="invoice">
    
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <div class="logo">🌾</div>
        <div>
          <div class="company-name">Grain Bank Management System</div>
          <div class="company-subtitle">State Agricultural Warehousing Corporation</div>
        </div>
      </div>
      <div class="invoice-title">
        <div class="invoice-label">INVOICE</div>
        <div class="invoice-type">${txnInfo.icon} GRAIN ${txnInfo.label}</div>
      </div>
    </div>

    <!-- Meta Information Row -->
    <div class="meta-row">
      <div class="meta-item">
        <div class="meta-label">Invoice No</div>
        <div class="meta-value">${invoiceNo}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Transaction ID</div>
        <div class="meta-value">${data._id?.slice(-12)?.toUpperCase() || 'N/A'}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Date</div>
        <div class="meta-value">${formatDate(data.transaction_date)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Time</div>
        <div class="meta-value">${formatTime(data.transaction_date)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Status</div>
        <div class="meta-value">
          <span class="status-badge status-${data.transaction_status}">
            ${data.transaction_status?.toUpperCase() || 'PENDING'}
          </span>
        </div>
      </div>
    </div>

    <!-- Farmer & Warehouse Info -->
    <div class="info-row">
      <div class="info-box">
        <div class="info-label">Farmer Details</div>
        <div class="info-value">${data.user_id?.name || 'N/A'}</div>
        <div class="info-sub">
          <strong>ID:</strong> ${data.user_id?.farmerProfile?.farmerId || 'N/A'} &nbsp;|&nbsp;
          <strong>📱</strong> ${data.user_id?.phone_number || 'N/A'}
        </div>
        <div class="info-sub">
          <strong>📧</strong> ${data.user_id?.email || 'N/A'}
        </div>
      </div>
      <div class="info-box warehouse">
        <div class="info-label">Warehouse Details</div>
        <div class="info-value">🏭 ${data.warehouse_id?.name || 'N/A'}</div>
        <div class="info-sub">
          <strong>📍</strong> ${data.warehouse_id?.location || 'N/A'}
        </div>
        <div class="info-sub">
          <strong>Code:</strong> ${data.warehouse_id?._id?.slice(-8)?.toUpperCase() || 'N/A'}
        </div>
      </div>
    </div>

    <!-- Grain Details Table -->
    <div class="table-section">
      <div class="table-header">📦 Grain Details</div>
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 25%;">Grain Type</th>
            <th class="text-center" style="width: 12%;">Quality</th>
            <th class="text-center" style="width: 12%;">Quantity</th>
            <th class="text-right" style="width: 15%;">Rate/Quintal</th>
            <th class="text-center" style="width: 12%;">Moisture</th>
            <th class="text-right" style="width: 19%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.grain?.map((g, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${g.category_id?.grain_type || 'N/A'}</strong></td>
              <td class="text-center">
                <span class="quality-badge quality-${g.category_id?.quality || 'B'}">
                  Grade ${g.category_id?.quality || '-'}
                </span>
              </td>
              <td class="text-center">${g.quantity_quintal || 0} ${g.category_id?.unit || 'Qtl'}</td>
              <td class="text-right">${formatCurrency(g.price_per_quintal)}</td>
              <td class="text-center">${g.moisture_content ? g.moisture_content + '%' : '-'}</td>
              <td class="text-right"><strong>${formatCurrency((g.quantity_quintal || 0) * (g.price_per_quintal || 0))}</strong></td>
            </tr>
          `).join('') || '<tr><td colspan="7" class="text-center">No grain details</td></tr>'}
        </tbody>
      </table>
    </div>

    <!-- Totals Section -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="total-row">
          <span class="total-label">Total Quantity</span>
          <span class="total-value">${totalQuantity} Quintal</span>
        </div>
        <div class="total-row">
          <span class="total-label">Transaction Type</span>
          <span class="total-value" style="text-transform: capitalize;">${data.transaction_type || 'N/A'}</span>
        </div>
        <div class="total-row">
          <span class="total-label" style="font-weight: 700;">TOTAL AMOUNT</span>
          <span class="total-value grand-total">${formatCurrency(data.total_amount)}</span>
        </div>
      </div>
    </div>

    <!-- Amount in Words -->
    <div class="amount-words">
      <strong>Amount in Words:</strong> Indian Rupees ${numberToWords(Math.floor(data.total_amount || 0))} Only
      ${data.remarks ? `<br><strong>Remarks:</strong> ${data.remarks}` : ''}
    </div>

    <!-- Approval Status -->
    <div class="approval-section">
      <div class="approval-box ${data.approval_status?.supervisor_approval?.status ? 'approved' : 'pending'}">
        <div class="approval-role">Supervisor</div>
        <div class="approval-icon">${data.approval_status?.supervisor_approval?.status ? '✅' : '⏳'}</div>
        <div class="approval-name">${data.approval_status?.supervisor_approval?.user_id?.name || 'Pending'}</div>
        <div class="approval-date">${data.approval_status?.supervisor_approval?.date ? formatDate(data.approval_status.supervisor_approval.date) : '-'}</div>
      </div>
      <div class="approval-box ${data.approval_status?.manager_approval?.status ? 'approved' : 'pending'}">
        <div class="approval-role">Manager</div>
        <div class="approval-icon">${data.approval_status?.manager_approval?.status ? '✅' : '⏳'}</div>
        <div class="approval-name">${data.approval_status?.manager_approval?.user_id?.name || 'Pending'}</div>
        <div class="approval-date">${data.approval_status?.manager_approval?.date ? formatDate(data.approval_status.manager_approval.date) : '-'}</div>
      </div>
      <div class="approval-box ${data.approval_status?.admin_approval?.status ? 'approved' : 'pending'}">
        <div class="approval-role">Administrator</div>
        <div class="approval-icon">${data.approval_status?.admin_approval?.status ? '✅' : '⏳'}</div>
        <div class="approval-name">${data.approval_status?.admin_approval?.user_id?.name || 'Pending'}</div>
        <div class="approval-date">${data.approval_status?.admin_approval?.date ? formatDate(data.approval_status.admin_approval.date) : '-'}</div>
      </div>
    </div>

    <!-- Terms -->
    <div class="terms">
      <div class="terms-title">📋 Terms & Conditions:</div>
      This certificate is valid only for the above transaction. Grain quality/moisture recorded at time of ${data.transaction_type || 'transaction'}. 
      Report discrepancies within 7 days. Preserve for future claims. Storage charges apply as per rates.
    </div>

    <!-- Signatures -->
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-title">Farmer's Signature</div>
        <div class="signature-subtitle">${data.user_id?.name || ''}</div>
      </div>
      <div class="signature-box">
        <div class="stamp">OFFICIAL<br>SEAL</div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-title">Authorized Signatory</div>
        <div class="signature-subtitle">Warehouse Manager</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        <span>📞 1800-XXX-XXXX</span>
        <span>📧 support@grainbank.gov.in</span>
        <span>🌐 www.grainbank.gov.in</span>
      </div>
      <div class="footer-center">
        Computer generated invoice • No signature required for digital copy<br>
        © ${new Date().getFullYear()} Grain Bank Management System
      </div>
      <div class="footer-right">
        Generated: ${formatDate(new Date())}<br>
        Page 1 of 1
      </div>
    </div>

  </div>
</body>
</html>
  `;
};