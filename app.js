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

  // Plan Selection
  const planPrices = {
    "1 Month": "₹1,000",
    "3 Months": "₹2,999",
    "6 Months": "₹5,499",
    "1 Year": "₹9,999"
  };

  document.querySelectorAll('.plan-card:not(.payment-card)').forEach(card => {
    card.addEventListener('click', (e) => {
      document.querySelectorAll('.plan-card:not(.payment-card)').forEach(c => c.classList.remove('selected'));
      const target = e.currentTarget;
      target.classList.add('selected');
      formData.planType = target.dataset.plan;
      
      // Update payment amounts
      const price = planPrices[formData.planType];
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

      const amountStr = planPrices[formData.planType].replace(/[^0-9]/g, '');
      const amount = parseInt(amountStr, 10);

      try {
        // 1. Create order on backend
        const response = await fetch('http://localhost:3000/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amount })
        });
        const data = await response.json();

        if (!data.success) throw new Error("Failed to create order");

        const startDateObj = new Date(formData.startDate);
        const expiryDateObj = calculateExpiryDate(startDateObj, formData.planType);
        const memberData = {
          memberId: `GYM6O9-${Date.now().toString().slice(-6)}`,
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
            const verifyRes = await fetch('http://localhost:3000/api/verify-payment', {
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
function initAdminDashboard() {
  const tableBody = document.getElementById('membersTableBody');
  if (!tableBody) return;

  // Dummy data (simulating Firestore fetch)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const members = [
    { id: "GYM-413064", name: "Rahul M", phoneNumber: "917025506123", expiryDate: today },
    { id: "GYM-981242", name: "Aisha K", phoneNumber: "917025506123", expiryDate: tomorrow },
    { id: "GYM-102931", name: "Safeer T", phoneNumber: "917025506123", expiryDate: nextMonth },
  ];

  // Helper to check expiry
  const isExpiringSoon = (expiry) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const exp = new Date(expiry);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  // Helper for WhatsApp link
  const getWhatsAppLink = (member) => {
    const dateStr = member.expiryDate.toLocaleDateString();
    const text = `Hi ${member.name}, your subscription at Gym 6O9 expires on ${dateStr}. Tap here to renew: https://gym6o9.com/renew`;
    return `https://wa.me/${member.phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  };

  // Render Table
  setTimeout(() => {
    tableBody.innerHTML = ''; // clear loading
    document.getElementById('totalMembers').innerText = members.length;

    members.forEach(member => {
      const expiring = isExpiringSoon(member.expiryDate);
      const row = document.createElement('tr');
      
      let actionHtml = '';
      if (expiring) {
        actionHtml = `<a href="${getWhatsAppLink(member)}" target="_blank" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem;">WhatsApp</a>`;
      }

      row.innerHTML = `
        <td style="font-weight: 500;">${member.name}</td>
        <td class="text-muted">${member.phoneNumber}</td>
        <td class="${expiring ? 'status-expiring' : ''}">${member.expiryDate.toLocaleDateString()}</td>
        <td style="text-align: right;">${actionHtml}</td>
      `;
      tableBody.appendChild(row);
    });
  }, 1000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initJoinForm();
  initAdminDashboard();
});
