import firebase from 'firebase/app'
import 'firebase/auth'

// 0. Add your firebase config
// 1. Make sur to activate email/password auth
// 2. Make sure to enable multifactor
// 3. You can add a test phone number in the firebase console -> signin methods -> phone

firebase.initializeApp({
  // YOUR CONFIG HERE
})

const auth = firebase.auth()

// Listen to User's Auth State

auth.onAuthStateChanged((user) => {
  const userEl = document.getElementById('user')
  const providersEl = document.getElementById('providers')
  if (user) {
    userEl.innerHTML = `${user.email} logged in. ${JSON.stringify(
      user.multiFactor.enrolledFactors
    )}`
    providersEl.innerHTML = JSON.stringify(
      user.providerData.find((el) => el.providerId === 'google.com')
    )
  } else {
    userEl.innerHTML = 'signed out'
  }
})

// Setup a global captcha

window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('2fa-captcha', {
  size: 'invisible',
  callback: function (response) {
    console.log('captcha solved!')
  },
})

// Step 1 - Sign Up and Verify Email
const signupBtn = document.getElementById('signup-button')

signupBtn.onclick = async () => {
  const email = document.getElementById('signup-email').value
  const password = document.getElementById('signup-password').value

  const credential = await auth.createUserWithEmailAndPassword(email, password)
  await credential.user.sendEmailVerification()

  alert('check your email!')
}

// Step 2 - Enroll Second Factor

const enrollBtn = document.getElementById('enroll-button')

enrollBtn.onclick = async () => {
  const phoneNumber = document.getElementById('enroll-phone').value

  const user = auth.currentUser

  const session = await user.multiFactor.getSession()

  const phoneOpts = {
    phoneNumber,
    session,
  }

  const phoneAuthProvider = new firebase.auth.PhoneAuthProvider()

  window.verificationId = await phoneAuthProvider.verifyPhoneNumber(
    phoneOpts,
    window.recaptchaVerifier
  )

  alert('sms text sent!')
}

const verifyEnrollmentBtn = document.getElementById('enroll-verify')

verifyEnrollmentBtn.onclick = async () => {
  const code = document.getElementById('enroll-code').value

  const cred = new firebase.auth.PhoneAuthProvider.credential(
    window.verificationId,
    code
  )

  const multiFactorAssertion = firebase.auth.PhoneMultiFactorGenerator.assertion(
    cred
  )

  const user = auth.currentUser
  await user.multiFactor.enroll(multiFactorAssertion, 'phone number')

  alert('enrolled in MFA')
}

// Step 3 - Link Google
const linkGoogle = document.getElementById('link-google')
linkGoogle.onclick = async () => {
  var googleProvider = new firebase.auth.GoogleAuthProvider()
  try {
    await auth.currentUser.linkWithPopup(googleProvider)
  } catch (err) {
    document.getElementById('link-error').innerHTML = err
  }
}
