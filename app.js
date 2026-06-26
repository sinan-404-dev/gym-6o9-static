// GYM 6O9 - Main Application Logic

/**
 * Calculates the expiry date based on a start date and a plan type.
 */
function calculateExpiryDate(startDate, planType) {
  const expiryDate = new Date(startDate);
  
  switch (planType) {
    case "1 Month":
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      break;
    case "3 Months":
      expiryDate.setMonth(expiryDate.getMonth() + 3);
      break;
    case "6 Months":
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      break;
    case "1 Year":
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      break;
    default:
      expiryDate.setMonth(expiryDate.getMonth() + 1);
  }
  
  return expiryDate;
}

let globalPrices = {
  "1 Month": "₹1,000",
  "3 Months": "₹2,999",
  "6 Months": "₹5,499",
  "1 Year": "₹9,999"
};

let globalFeatures = {
  "1 Month": "Full Gym Access",
  "3 Months": "Full Gym Access\n1 Guest Pass/month",
  "6 Months": "Full Gym Access\n2 Guest Passes/month\nBasic Health Consult",
  "1 Year": "Full Gym Access\nUnlimited Guest Passes\nFull Health Consulting\nPriority Support"
};

const renderFeatures = (featuresStr, isPrimary = false) => {
  if (!featuresStr) return '';
  return featuresStr.split('\n').filter(f => f.trim()).map(f => {
    return `<li><span class="check-icon ${isPrimary ? 'text-primary' : ''}">✓</span> ${f.trim()}</li>`;
  }).join('');
};

async function fetchDynamicPrices() {
  try {
    const res = await fetch('/api/prices');
    const data = await res.json();
    if (data.success && data.prices) {
      globalPrices = data.prices;
      
      // Update Index Page if elements exist
      if (document.getElementById('display-price-1m')) document.getElementById('display-price-1m').innerText = globalPrices["1 Month"];
      if (document.getElementById('display-price-3m')) document.getElementById('display-price-3m').innerText = globalPrices["3 Months"];
      if (document.getElementById('display-price-6m')) document.getElementById('display-price-6m').innerText = globalPrices["6 Months"];
      if (document.getElementById('display-price-1y')) document.getElementById('display-price-1y').innerText = globalPrices["1 Year"];
    }
  } catch (err) {
    console.error("Could not fetch dynamic prices", err);
  }
}

async function fetchDynamicFeatures() {
  try {
    const res = await fetch('/api/features');
    const data = await res.json();
    if (data.success && data.features) {
      globalFeatures = data.features;
      
      // Update Index Page Features
      if (document.getElementById('features-1m')) document.getElementById('features-1m').innerHTML = renderFeatures(globalFeatures["1 Month"]);
      if (document.getElementById('features-3m')) document.getElementById('features-3m').innerHTML = renderFeatures(globalFeatures["3 Months"]);
      if (document.getElementById('features-6m')) document.getElementById('features-6m').innerHTML = renderFeatures(globalFeatures["6 Months"]);
      if (document.getElementById('features-1y')) document.getElementById('features-1y').innerHTML = renderFeatures(globalFeatures["1 Year"], true);
    }
  } catch (err) {
    console.error("Could not fetch dynamic features", err);
  }
}

/**
 * Multi-Step Form Logic for join.html
 */
function initJoinForm() {
  const form = document.getElementById('joinForm');
  if (!form) return;

  let currentStep = 1;
  const formData = {
    name: '',
    phoneNumber: '',
    planType: '1 Month',
    startDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Razorpay'
  };

  const steps = [
    document.getElementById('step1'),
    document.getElementById('step2'),
    document.getElementById('step3'),
    document.getElementById('step4')
  ];
  const stepIndicators = [
    document.getElementById('indicator1'),
    document.getElementById('indicator2'),
    document.getElementById('indicator3'),
    document.getElementById('indicator4')
  ];

  const btnNext = document.getElementById('btnNext');
  const btnBack = document.getElementById('btnBack');

  // Input listeners
  document.getElementById('nameInput').addEventListener('input', (e) => formData.name = e.target.value);
  document.getElementById('phoneInput').addEventListener('input', (e) => formData.phoneNumber = e.target.value);
  document.getElementById('dateInput').value = formData.startDate;
  document.getElementById('dateInput').addEventListener('input', (e) => formData.startDate = e.target.value);

  // Plan Selection uses globalPrices


  document.querySelectorAll('.plan-card:not(.payment-card)').forEach(card => {
    card.addEventListener('click', (e) => {
      document.querySelectorAll('.plan-card:not(.payment-card)').forEach(c => c.classList.remove('selected'));
      const target = e.currentTarget;
      target.classList.add('selected');
      formData.planType = target.dataset.plan;
      
      // Update payment amounts
      const price = globalPrices[formData.planType];
      const payAmountEl = document.getElementById('payAmount');
      if(payAmountEl) payAmountEl.innerText = price;
    });
  });

  // Payment Selection
  document.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('click', (e) => {
      document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
      const target = e.currentTarget;
      target.classList.add('selected');
      formData.paymentMethod = target.dataset.method;
      
      if (formData.paymentMethod === 'Razorpay') {
        document.getElementById('razorpaySection').classList.remove('hidden');
        document.getElementById('cashSection').classList.add('hidden');
        if(currentStep === 4) btnNext.innerText = 'Pay securely with Razorpay';
      } else {
        document.getElementById('razorpaySection').classList.add('hidden');
        document.getElementById('cashSection').classList.remove('hidden');
        if(currentStep === 4) btnNext.innerText = 'Complete Admission';
      }
    });
  });

  const updateUI = () => {
    // Show/hide sections
    steps.forEach((el, index) => {
      if (index + 1 === currentStep) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });

    // Update indicators
    stepIndicators.forEach((el, index) => {
      if (index + 1 <= currentStep) el.classList.add('active');
      else el.classList.remove('active');
    });

    // Update buttons
    if (currentStep === 1) {
      btnBack.classList.add('hidden');
      btnNext.innerText = 'Next Step';
    } else if (currentStep === 3) {
      btnBack.classList.remove('hidden');
      btnNext.innerText = 'Proceed to Payment';
      
      // Update Summary
      document.getElementById('sumName').innerText = formData.name;
      document.getElementById('sumPhone').innerText = formData.phoneNumber;
      document.getElementById('sumPlan').innerText = formData.planType;
      document.getElementById('sumDate').innerText = formData.startDate;
    } else if (currentStep === 4) {
      btnBack.classList.remove('hidden');
      btnNext.innerText = formData.paymentMethod === 'Razorpay' ? 'Pay securely with Razorpay' : 'Complete Admission';
    } else {
      btnBack.classList.remove('hidden');
      btnNext.innerText = 'Next Step';
    }
  };

  btnNext.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Validation
    if (currentStep === 1) {
      if (!formData.name || !formData.phoneNumber) {
        alert("Please fill out all fields.");
        return;
      }
    }
    if (currentStep === 4 && formData.paymentMethod === 'Razorpay') {
      // Trigger Razorpay Flow
      btnNext.innerText = 'Initializing...';
      btnNext.disabled = true;
      btnBack.disabled = true;

      const amountStr = globalPrices[formData.planType].replace(/[^0-9]/g, '');
      const amount = parseInt(amountStr, 10);

      try {
        // 1. Create order on backend
        const response = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amount })
        });
        const data = await response.json();

        if (!data.success) throw new Error("Failed to create order");

        const startDateObj = new Date(formData.startDate);
        const expiryDateObj = calculateExpiryDate(startDateObj, formData.planType);
        const memberData = {
          memberId: `GYM-${Math.floor(1000 + Math.random() * 9000)}`,
          name: formData.name,
          whatsappNumber: formData.phoneNumber,
          planType: formData.planType,
          startDate: formData.startDate,
          expiryDate: expiryDateObj.toISOString().split('T')[0],
          paymentMethod: formData.paymentMethod,
          status: "Active"
        };

        // 2. Open Razorpay Checkout
        const options = {
          key: 'rzp_test_T6KVR8Q2wjD5F4', // The backend verifies the secret, but frontend needs key_id
          amount: data.order.amount,
          currency: "INR",
          name: "GYM 6O9",
          description: `Membership: ${formData.planType}`,
          order_id: data.order.id,
          handler: async function (response) {
            btnNext.innerText = 'Verifying Payment...';
            // 3. Verify Payment
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                memberData: memberData
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              document.getElementById('successMemberId').innerText = verifyData.memberId;
              document.getElementById('formContainer').classList.add('hidden');
              document.getElementById('successState').classList.remove('hidden');
            } else {
              alert("Payment verification failed! Please contact support.");
              btnNext.innerText = 'Pay securely with Razorpay';
              btnNext.disabled = false;
              btnBack.disabled = false;
            }
          },
          prefill: {
            name: formData.name,
            contact: formData.phoneNumber
          },
          theme: { color: "#F26522" }
        };

        const rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', function (response){
          alert("Payment Failed: " + response.error.description);
          btnNext.innerText = 'Pay securely with Razorpay';
          btnNext.disabled = false;
          btnBack.disabled = false;
        });
        rzp1.open();

      } catch (err) {
        console.error(err);
        alert("Error initializing payment. Please try again.");
        btnNext.innerText = 'Pay securely with Razorpay';
        btnNext.disabled = false;
        btnBack.disabled = false;
      }
      return;
    }

    if (currentStep < 4) {
      currentStep++;
      updateUI();
    } else {
      // Cash Submission
      btnNext.innerText = 'Processing...';
      btnNext.disabled = true;
      btnBack.disabled = true;

      // Simulate network delay for Cash option
      setTimeout(() => {
        document.getElementById('formContainer').classList.add('hidden');
        document.getElementById('successState').classList.remove('hidden');
      }, 1000);
    }
  });

  btnBack.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentStep > 1) {
      currentStep--;
      updateUI();
    }
  });

  // Initial UI Setup
  updateUI();
}

/**
 * Admin Dashboard Logic for admin.html
 */
async function initAdminDashboard() {
  const tableBody = document.getElementById('membersTableBody');
  if (!tableBody) return;

  // 1. Setup Pricing Editor
  if (document.getElementById('price-1m')) {
    document.getElementById('price-1m').value = globalPrices["1 Month"];
    document.getElementById('price-3m').value = globalPrices["3 Months"];
    document.getElementById('price-6m').value = globalPrices["6 Months"];
    document.getElementById('price-1y').value = globalPrices["1 Year"];

    document.getElementById('savePricesBtn').addEventListener('click', async (e) => {
      const btn = e.target;
      btn.innerText = 'Saving...';
      const newPrices = {
        "1 Month": document.getElementById('price-1m').value,
        "3 Months": document.getElementById('price-3m').value,
        "6 Months": document.getElementById('price-6m').value,
        "1 Year": document.getElementById('price-1y').value
      };
      
      try {
        const res = await fetch('/api/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prices: newPrices })
        });
        if (res.ok) {
          alert('Prices updated successfully!');
          globalPrices = newPrices;
        }
      } catch (err) {
        alert('Failed to save prices');
      }
      btn.innerText = 'Save New Prices';
    });
  }

  // 1b. Setup Features Editor
  if (document.getElementById('features-1m-input')) {
    document.getElementById('features-1m-input').value = globalFeatures["1 Month"];
    document.getElementById('features-3m-input').value = globalFeatures["3 Months"];
    document.getElementById('features-6m-input').value = globalFeatures["6 Months"];
    document.getElementById('features-1y-input').value = globalFeatures["1 Year"];

    document.getElementById('saveFeaturesBtn').addEventListener('click', async (e) => {
      const btn = e.target;
      btn.innerText = 'Saving...';
      const newFeatures = {
        "1 Month": document.getElementById('features-1m-input').value,
        "3 Months": document.getElementById('features-3m-input').value,
        "6 Months": document.getElementById('features-6m-input').value,
        "1 Year": document.getElementById('features-1y-input').value
      };
      
      try {
        const res = await fetch('/api/features', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ features: newFeatures })
        });
        if (res.ok) {
          alert('Features updated successfully!');
          globalFeatures = newFeatures;
        }
      } catch (err) {
        alert('Failed to save features');
      }
      btn.innerText = 'Save New Features';
    });
  }

  // 2. Fetch Members
  try {
    const res = await fetch('/api/admin/members');
    const data = await res.json();
    let allMembers = data.members || [];
    
    // Helper for WhatsApp link
    const getWhatsAppLink = (member, daysLeft) => {
      const dateStr = new Date(member.expiryDate).toLocaleDateString();
      let text = '';
      if (daysLeft < 0) {
        text = `Hi ${member.name}, your subscription at Gym 6O9 expired on ${dateStr}. Tap here to renew: https://gym6o9.com/renew`;
      } else {
        text = `Hi ${member.name}, your subscription at Gym 6O9 expires in ${daysLeft} days (on ${dateStr}). Tap here to renew: https://gym6o9.com/renew`;
      }
      return `https://wa.me/${member.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    };

    const renderTable = (filterType) => {
      tableBody.innerHTML = ''; 
      
      const today = new Date();
      today.setHours(0,0,0,0);

      // Filter Logic
      let filteredMembers = allMembers.filter(member => {
        const expDate = new Date(member.expiryDate);
        expDate.setHours(0,0,0,0);
        const diffTime = expDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        member._daysLeft = daysLeft; // save for rendering
        
        if (filterType === 'expired') return daysLeft < 0;
        if (filterType === 'expiring-3') return daysLeft >= 0 && daysLeft <= 3;
        return true; // 'all'
      });

      document.getElementById('totalMembers').innerText = filteredMembers.length;

      filteredMembers.forEach(member => {
        const isExpired = member._daysLeft < 0;
        const daysLeftText = isExpired ? 'Expired' : `${member._daysLeft} Days`;
        const daysLeftColor = isExpired ? '#ff4444' : (member._daysLeft <= 3 ? '#F26522' : '#2ecc71');
        
        const btnStyle = isExpired ? 'background: #ff4444; border-color: #ff4444;' : 'background: #2ecc71; border-color: #2ecc71;';
        const row = document.createElement('tr');

        const planName = member.planType || 'N/A';
        const planPrice = globalPrices[planName] || '';
        const memberIdStr = member.memberId || 'N/A';

        row.innerHTML = `
          <td data-label="ID" style="font-weight: bold; color: var(--primary);">${memberIdStr}</td>
          <td data-label="Name" style="font-weight: 500;">${member.name}</td>
          <td data-label="Phone" class="text-muted">${member.whatsappNumber}</td>
          <td data-label="Plan" class="text-primary">${planName} <span style="font-size:0.8rem; color:var(--text-muted)">(${planPrice})</span></td>
          <td data-label="Expiry Date" class="${isExpired ? 'status-expiring' : ''}">${new Date(member.expiryDate).toLocaleDateString()}</td>
          <td data-label="Days Left" style="color: ${daysLeftColor}; font-weight: bold;">${daysLeftText}</td>
          <td data-label="Action" style="text-align: right;">
            <a href="${getWhatsAppLink(member, member._daysLeft)}" target="_blank" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem; ${btnStyle}">WhatsApp</a>
          </td>
        `;
        tableBody.appendChild(row);
      });

      if (filteredMembers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">No members found.</td></tr>';
      }
    };

    // Initial Render
    renderTable('all');

    // Filter Event Listener
    if(document.getElementById('memberFilter')) {
      document.getElementById('memberFilter').addEventListener('change', (e) => {
        renderTable(e.target.value);
      });
    }

  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ff4444; padding: 40px;">Error loading members.</td></tr>';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await fetchDynamicPrices();
  await fetchDynamicFeatures();
  initJoinForm();
  initAdminDashboard();
});
