// ── Justexa Translations ──────────────────────────────────────────────────────
// Usage: const { lang } = useLanguage(); const t = T[lang];
// ─────────────────────────────────────────────────────────────────────────────

const T = {
    en: {
        // ── Navbar ──────────────────────────────────────────────
        login: 'Login',
        signup: 'Sign Up',

        // ── Sidebar ─────────────────────────────────────────────
        nav_dashboard: 'Dashboard',
        nav_petition: 'AI Petition',
        nav_cases: 'Case Tracker',
        nav_calendar: 'Court Calendar',
        nav_marketplace: 'Marketplace',

        // ── Dashboard ───────────────────────────────────────────
        dash_tag: 'Legal Services Platform',
        dash_hero: 'Justice, Simplified.',
        dash_desc: 'Access legal tools, track your cases, and connect with verified advocates — all in one platform.',
        dash_box_petition_title: 'AI Petition Generator',
        dash_box_petition_desc: 'Describe your legal situation and get a professionally formatted petition document instantly.',
        dash_box_cases_title: 'Case Tracker',
        dash_box_cases_desc: 'Enter a CNR number to fetch complete case details, status, and next hearing date.',
        dash_box_holidays_title: 'Court Holiday Tracker',
        dash_box_holidays_desc: 'Interactive calendar showing court holidays, closures, and important legal dates.',
        dash_box_market_title: 'Advocate Marketplace',
        dash_box_market_desc: 'Find and connect with verified advocates by specialization. Schedule a video conference.',
        dash_stat_cases: 'Cases Tracked',
        dash_stat_advocates: 'Verified Advocates',
        dash_stat_petitions: 'Petitions Generated',
        dash_stat_satisfaction: 'Client Satisfaction',
        modal_login_required: 'Login Required',
        modal_login_msg: 'Please sign in to your account to continue',
        modal_sign_in: '👤 Sign In as User',
        cancel: 'Cancel',

        // ── Login ───────────────────────────────────────────────
        login_welcome: 'Welcome Back',
        login_subtitle: 'Sign in to your Justexa account',
        login_email: 'Email Address',
        login_password: 'Password',
        login_forgot: 'Forgot password?',
        login_btn: 'Sign In',
        login_signing: 'Signing in...',
        login_google: 'Continue with Google',
        login_no_account: "don't have an account?",
        login_create: 'Create Account',
        login_admin: '🛡️ Admin Panel',

        // ── Signup ──────────────────────────────────────────────
        signup_title: 'Create Account',
        signup_step: 'Step {step} of 2',
        signup_name: 'Full Name',
        signup_location: 'Location',
        signup_email: 'Email Address',
        signup_continue: 'Continue →',
        signup_password: 'Password',
        signup_confirm: 'Confirm Password',
        signup_back: '← Back',
        signup_creating: 'Creating...',
        signup_create: 'Create Account',
        signup_have_account: 'already have an account?',
        signup_signin: 'Sign In',

        // ── Forgot Password ─────────────────────────────────────
        forgot_title: 'Reset Password',
        forgot_subtitle: 'Enter your email to receive a reset link',
        forgot_email: 'Email Address',
        forgot_send: 'Send Reset Link',
        forgot_sending: 'Sending...',
        forgot_back_login: '← Back to Login',

        // ── Profile ─────────────────────────────────────────────
        profile_title: 'My Profile',
        profile_subtitle: 'Your account information and details',
        profile_account_details: 'Account Details',
        profile_edit: '✏️ Edit Profile',
        profile_full_name: 'Full Name',
        profile_email: 'Email Address',
        profile_location: 'Location',
        profile_bar: 'Bar Council ID',
        profile_spec: 'Specialization',
        profile_exp: 'Experience',
        profile_type: 'Account Type',
        profile_since: 'Member Since',
        profile_save: '💾 Save Changes',
        profile_saving: 'Saving...',
        profile_cancel: 'Cancel',
        profile_updated: 'Profile updated successfully!',
        profile_logout: '🚪 Logout',

        // ── AI Petition Generator ───────────────────────────────
        petition_title: 'AI Petition Generator',
        petition_subtitle: 'Describe your legal situation and get a professionally formatted petition — powered by Groq AI',
        petition_tab_generate: '✍️ Generate',
        petition_tab_history: '📋 History',
        petition_label_input: 'Your Legal Situation',
        petition_chars: '{n} chars',
        petition_clear: '✕ Clear',
        petition_placeholder: 'Describe your legal situation in detail.\n\nExample: "My landlord refused to return my ₹50,000 deposit even after I vacated on time..."',
        petition_generate_btn: '✍️ Generate Petition',
        petition_generating: 'Generating with AI...',
        petition_output_label: 'Generated Petition',
        petition_copy: '📋 Copy',
        petition_print: '🖨 Print',
        petition_output_placeholder: 'Your AI-generated legal petition will appear here.\n\nDescribe your situation on the left and click "Generate Petition".',
        petition_ai_generating: '⚡ AI is drafting your petition...\n\nThis usually takes 5–10 seconds.',
        petition_powered: '⚡ Powered by Groq LLaMA 3.3 70B — Generates formal Indian legal petitions in seconds.',
        petition_no_history: 'No petitions generated yet. Generate your first petition above!',
        petition_re_generate: 'Click to re-generate →',
        petition_please_desc: 'Please describe your legal situation before generating.',

        // ── Case Tracker ────────────────────────────────────────
        case_title: 'Case Tracker',
        case_subtitle: 'Track your cases in real-time',
        case_cnr_label: 'CNR Number',
        case_cnr_placeholder: 'Enter CNR number (e.g. KLHC010012342023)',
        case_search: '🔍 Track Case',
        case_searching: 'Fetching case...',

        // ── Court Calendar ──────────────────────────────────────
        holiday_title: 'Court Holiday Tracker',
        holiday_subtitle: 'View court holidays and important dates',

        // ── Marketplace ─────────────────────────────────────────
        market_title: 'Advocate Marketplace',
        market_subtitle: 'Find and connect with verified advocates',
        market_search: 'Search advocates...',
        market_filter: 'Filter by specialization',
        market_no_results: 'No advocates found.',
        market_connect: 'Connect',
        market_view: 'View Profile',
    },

    ta: {
        // ── Navbar ──────────────────────────────────────────────
        login: 'உள்நுழை',
        signup: 'பதிவு செய்',

        // ── Sidebar ─────────────────────────────────────────────
        nav_dashboard: 'முகப்பு',
        nav_petition: 'AI மனு',
        nav_cases: 'வழக்கு கண்காணிப்பு',
        nav_calendar: 'நீதிமன்ற நாட்காட்டி',
        nav_marketplace: 'சந்தை',

        // ── Dashboard ───────────────────────────────────────────
        dash_tag: 'சட்ட சேவைகள் தளம்',
        dash_hero: 'நீதி, எளிமையாக.',
        dash_desc: 'சட்ட கருவிகளை அணுகவும், வழக்குகளை கண்காணிக்கவும், சரிபார்க்கப்பட்ட வழக்குரைஞர்களுடன் இணையவும் — அனைத்தும் ஒரே தளத்தில்.',
        dash_box_petition_title: 'AI மனு உருவாக்கி',
        dash_box_petition_desc: 'உங்கள் சட்ட நிலையை விவரிக்கவும், உடனடியாக ஒரு தொழில்முறை மனு கிடைக்கும்.',
        dash_box_cases_title: 'வழக்கு கண்காணிப்பு',
        dash_box_cases_desc: 'CNR எண்ணை உள்ளிட்டு வழக்கின் நிலை மற்றும் அடுத்த விசாரணை தேதியை அறியவும்.',
        dash_box_holidays_title: 'நீதிமன்ற விடுமுறை கண்காணிப்பு',
        dash_box_holidays_desc: 'நீதிமன்ற விடுமுறைகள் மற்றும் முக்கியமான சட்ட தேதிகளை காட்டும் காலண்டர்.',
        dash_box_market_title: 'வழக்குரைஞர் சந்தை',
        dash_box_market_desc: 'நிபுணத்துவம் மூலம் சரிபார்க்கப்பட்ட வழக்குரைஞர்களை கண்டறியவும். வீடியோ மாநாடு திட்டமிடவும்.',
        dash_stat_cases: 'கண்காணிக்கப்பட்ட வழக்குகள்',
        dash_stat_advocates: 'சரிபார்க்கப்பட்ட வழக்குரைஞர்கள்',
        dash_stat_petitions: 'உருவாக்கப்பட்ட மனுக்கள்',
        dash_stat_satisfaction: 'வாடிக்கையாளர் திருப்தி',
        modal_login_required: 'உள்நுழைவு தேவை',
        modal_login_msg: 'தொடர உங்கள் கணக்கில் உள்நுழையவும்',
        modal_sign_in: '👤 பயனராக உள்நுழைக',
        cancel: 'ரத்து செய்',

        // ── Login ───────────────────────────────────────────────
        login_welcome: 'மீண்டும் வரவேற்கிறோம்',
        login_subtitle: 'உங்கள் Justexa கணக்கில் உள்நுழைக',
        login_email: 'மின்னஞ்சல் முகவரி',
        login_password: 'கடவுச்சொல்',
        login_forgot: 'கடவுச்சொல் மறந்துவிட்டீர்களா?',
        login_btn: 'உள்நுழை',
        login_signing: 'உள்நுழைகிறது...',
        login_google: 'Google மூலம் தொடரவும்',
        login_no_account: 'கணக்கு இல்லையா?',
        login_create: 'கணக்கு உருவாக்கு',
        login_admin: '🛡️ நிர்வாக பலகை',

        // ── Signup ──────────────────────────────────────────────
        signup_title: 'கணக்கு உருவாக்கு',
        signup_step: 'படி {step} / 2',
        signup_name: 'முழு பெயர்',
        signup_location: 'இடம்',
        signup_email: 'மின்னஞ்சல் முகவரி',
        signup_continue: 'தொடர →',
        signup_password: 'கடவுச்சொல்',
        signup_confirm: 'கடவுச்சொல் உறுதிப்படுத்து',
        signup_back: '← திரும்பு',
        signup_creating: 'உருவாக்குகிறது...',
        signup_create: 'கணக்கு உருவாக்கு',
        signup_have_account: 'ஏற்கனவே கணக்கு இருக்கிறதா?',
        signup_signin: 'உள்நுழை',

        // ── Forgot Password ─────────────────────────────────────
        forgot_title: 'கடவுச்சொல் மீட்டமை',
        forgot_subtitle: 'மீட்டமைப்பு இணைப்பு பெற உங்கள் மின்னஞ்சலை உள்ளிடவும்',
        forgot_email: 'மின்னஞ்சல் முகவரி',
        forgot_send: 'மீட்டமைப்பு இணைப்பு அனுப்பு',
        forgot_sending: 'அனுப்புகிறது...',
        forgot_back_login: '← உள்நுழைவுக்கு திரும்பு',

        // ── Profile ─────────────────────────────────────────────
        profile_title: 'என் சுயவிவரம்',
        profile_subtitle: 'உங்கள் கணக்கு தகவல் மற்றும் விவரங்கள்',
        profile_account_details: 'கணக்கு விவரங்கள்',
        profile_edit: '✏️ சுயவிவரம் திருத்து',
        profile_full_name: 'முழு பெயர்',
        profile_email: 'மின்னஞ்சல் முகவரி',
        profile_location: 'இடம்',
        profile_bar: 'பார் கவுன்சில் ID',
        profile_spec: 'நிபுணத்துவம்',
        profile_exp: 'அனுபவம்',
        profile_type: 'கணக்கு வகை',
        profile_since: 'உறுப்பினர் தொடங்கிய நாள்',
        profile_save: '💾 மாற்றங்களை சேமி',
        profile_saving: 'சேமிக்கிறது...',
        profile_cancel: 'ரத்து',
        profile_updated: 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!',
        profile_logout: '🚪 வெளியேறு',

        // ── AI Petition Generator ───────────────────────────────
        petition_title: 'AI மனு உருவாக்கி',
        petition_subtitle: 'உங்கள் சட்ட நிலையை விவரித்து தொழில்முறை மனு பெறுங்கள் — Groq AI மூலம்',
        petition_tab_generate: '✍️ உருவாக்கு',
        petition_tab_history: '📋 வரலாறு',
        petition_label_input: 'உங்கள் சட்ட நிலை',
        petition_chars: '{n} எழுத்துகள்',
        petition_clear: '✕ அழி',
        petition_placeholder: 'உங்கள் சட்ட நிலையை விரிவாக விவரிக்கவும்.\n\nஎடுத்துக்காட்டு: "என் வீட்டு உரிமையாளர் நேரத்தில் வெளியேறிய பிறகும் ₹50,000 வைப்பு திரும்ப கொடுக்க மறுக்கிறார்..."',
        petition_generate_btn: '✍️ மனு உருவாக்கு',
        petition_generating: 'AI மூலம் உருவாக்குகிறது...',
        petition_output_label: 'உருவாக்கப்பட்ட மனு',
        petition_copy: '📋 நகல் எடு',
        petition_print: '🖨 அச்சிடு',
        petition_output_placeholder: 'உங்கள் AI மனு இங்கே தோன்றும்.\n\nஇடதுபுறத்தில் விவரிக்கவும் மற்றும் "மனு உருவாக்கு" கிளிக் செய்யவும்.',
        petition_ai_generating: '⚡ AI உங்கள் மனுவை தயாரிக்கிறது...\n\nசாதாரணமாக 5–10 வினாடிகள் ஆகும்.',
        petition_powered: '⚡ Groq LLaMA 3.3 70B மூலம் — நொடியில் சட்ட மனுக்கள்.',
        petition_no_history: 'இதுவரை மனுக்கள் இல்லை. மேலே உங்கள் முதல் மனுவை உருவாக்கவும்!',
        petition_re_generate: 'மீண்டும் உருவாக்க கிளிக் செய்யவும் →',
        petition_please_desc: 'உருவாக்குவதற்கு முன் உங்கள் சட்ட நிலையை விவரிக்கவும்.',

        // ── Case Tracker ────────────────────────────────────────
        case_title: 'வழக்கு கண்காணிப்பு',
        case_subtitle: 'உங்கள் வழக்குகளை நேரடியாக கண்காணிக்கவும்',
        case_cnr_label: 'CNR எண்',
        case_cnr_placeholder: 'CNR எண்ணை உள்ளிடவும் (எ.கா. KLHC010012342023)',
        case_search: '🔍 வழக்கு கண்காணி',
        case_searching: 'வழக்கை பெறுகிறது...',

        // ── Court Calendar ──────────────────────────────────────
        holiday_title: 'நீதிமன்ற விடுமுறை கண்காணிப்பு',
        holiday_subtitle: 'நீதிமன்ற விடுமுறைகள் மற்றும் முக்கியமான தேதிகளை பார்க்கவும்',

        // ── Marketplace ─────────────────────────────────────────
        market_title: 'வழக்குரைஞர் சந்தை',
        market_subtitle: 'சரிபார்க்கப்பட்ட வழக்குரைஞர்களை கண்டறிந்து இணையவும்',
        market_search: 'வழக்குரைஞர்களை தேடவும்...',
        market_filter: 'நிபுணத்துவம் மூலம் வடிகட்டு',
        market_no_results: 'வழக்குரைஞர்கள் கிடைக்கவில்லை.',
        market_connect: 'இணை',
        market_view: 'சுயவிவரம் பார்',
    },
};

export default T;
