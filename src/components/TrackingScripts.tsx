import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const GA4_ID_REGEX = /^G-[A-Z0-9]+$/;
const GTM_ID_REGEX = /^GTM-[A-Z0-9]+$/;
const META_PIXEL_REGEX = /^\d+$/;

const TrackingScripts = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, 'tracking_settings'));
      const map: Record<string, string> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.value) map[data.key || d.id] = data.value;
      });
      setSettings(map);
    };
    load();
  }, []);

  useEffect(() => {
    if (settings.ga4_measurement_id) {
      const id = settings.ga4_measurement_id;
      if (GA4_ID_REGEX.test(id) && !document.getElementById('ga4-script')) {
        const s = document.createElement('script');
        s.id = 'ga4-script'; s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
        document.head.appendChild(s);
        const s2 = document.createElement('script');
        s2.id = 'ga4-config';
        s2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`;
        document.head.appendChild(s2);
      }
    }
    if (settings.gtm_container_id) {
      const id = settings.gtm_container_id;
      if (GTM_ID_REGEX.test(id) && !document.getElementById('gtm-script')) {
        const s = document.createElement('script');
        s.id = 'gtm-script';
        s.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;
        document.head.appendChild(s);
      }
    }
    if (settings.meta_pixel_id) {
      const id = settings.meta_pixel_id;
      if (META_PIXEL_REGEX.test(id) && !document.getElementById('meta-pixel-script')) {
        const s = document.createElement('script');
        s.id = 'meta-pixel-script';
        s.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;
        document.head.appendChild(s);
      }
    }
  }, [settings]);

  return null;
};

export default TrackingScripts;
