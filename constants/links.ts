import { Platform } from 'react-native';

export interface ExternalLink {
  label: string;
  detail: string;
  url: string;
}

// Official Air Force references. BriefBuilder is not affiliated with any of
// these; they are provided for convenience.
export const OFFICIAL_REFERENCES: ExternalLink[] = [
  {
    label: 'AFI 36-2406',
    detail: 'Officer and Enlisted Evaluation Systems (PDF)',
    url: 'https://static.e-publishing.af.mil/production/1/af_a1/publication/afi36-2406/afi36-2406.pdf',
  },
  {
    label: 'myEval',
    detail: 'Opens myFSS, where myEval lives. CAC required.',
    url: 'https://myfss.us.af.mil/',
  },
  {
    label: 'AF Form 716',
    detail: 'Enlisted Performance Brief. Search "AF716" on e-Publishing.',
    url: 'https://www.e-publishing.af.mil/',
  },
  {
    label: 'AF Acronym & Abbreviation List',
    detail: 'The only acronyms authorized in performance statements',
    url: 'https://www.afpc.af.mil/Career-Management/Acronyms/',
  },
];

// The other apps are iPhone apps, so Android users get the web pages instead.
const ios = Platform.OS === 'ios';

export const DAHVIO_APPS: ExternalLink[] = [
  {
    label: 'WAPS Study',
    detail: 'AFH-1 and SJT prep for SSgt and TSgt promotion testing',
    url: ios
      ? 'https://apps.apple.com/us/app/waps-pdg-afh1-2027-ssgt-tsgt/id6762496327'
      : 'https://dahvio.com/waps-study-2026',
  },
  {
    label: 'PFA Calculator',
    detail: 'Score your Air Force fitness assessment before test day',
    url: ios
      ? 'https://apps.apple.com/us/app/pfra-pfa-calculator-2027/id6761141936'
      : 'https://dahvio.com/air-force-pt-calculator-2026',
  },
];

// The App Store record's Apple ID (App Store Connect → App Information).
const APP_STORE_ID = '6835032478';

// User-initiated rating and feedback, from the Profile tab. Opening the
// store's write-review page on a tap is allowed; only automatic prompts must
// use the system dialog (services/review.ts). Works once the app is live.
export const FEEDBACK_LINKS: ExternalLink[] = [
  {
    label: 'Rate BriefBuilder',
    detail: ios ? 'Leave a rating on the App Store' : 'Leave a rating on Google Play',
    url: ios
      ? `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`
      : 'https://play.google.com/store/apps/details?id=com.dahvio.briefbuilder',
  },
  {
    label: 'Send feedback',
    detail: 'Something missing or not working? Email the developer',
    url: 'mailto:ray@dahvio.com?subject=BriefBuilder%20feedback',
  },
];

// Where a shared referral message sends people to get the app.
export const APP_SHARE_URL = 'https://dahvio.com/epb-builder';
export const SUPPORT_URL ='https://dahvio.com/epb-builder-support';
export const PRIVACY_URL = 'https://dahvio.com/epb-builder-privacy';
// Apple's standard licence agreement. App Review requires a Terms of Use link
// wherever an auto-renewing subscription is sold.
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
