import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center ml-3">
                  <span className="text-white font-bold text-lg">م</span>
                </div>
                <div className="mr-3">
                  <h3 className="text-xl font-bold">مُعين</h3>
                  <p className="text-sm text-gray-400">منصة حفظ وتقييم القرآن الكريم</p>
                </div>
              </div>
            </Link>
            <p className="text-gray-400 mb-4 max-w-md">
              منصة متقدمة لحفظ وتقييم القرآن الكريم بالذكاء الاصطناعي وتقييم التجويد. انضم إلى آلاف الحفاظ الذين يثقون بمنصتنا.
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 مُعين. جميع الحقوق محفوظة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-gray-400 hover:text-white transition-colors">
                  المميزات
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">
                  الأسعار
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
                  المدونة
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">الدعم</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                  مركز المساعدة
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  اتصل بنا
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                  الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-gray-400 hover:text-white transition-colors">
                  آراء المستخدمين
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">قانوني</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">
                  سياسة الكوكيز
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="text-gray-400 hover:text-white transition-colors">
                  الامتثال
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              منصة مُعين معتمدة ومتوافقة مع معايير حماية البيانات الشخصية
            </div>
            <div className="flex space-x-reverse space-x-6">
              <Link href="https://facebook.com" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">فيسبوك</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v8.385C8.395 23.052 12.001 22.953 18.125 22.953 6.627 0 12-5.373 12-12z"/>
                </svg>
              </Link>
              <Link href="https://twitter.com" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">تويتر</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.966 4.966 0 00-2.184.622 9.92 9.92 0 004.241.812v1.84a5.002 5.002 0 00-4.864 4.887c-.354-.032-.688-.058-1.023-.084a5.002 5.002 0 004.864-4.886v-1.84a9.92 9.92 0 00-4.241-.812 10 10 0 012.825-.775c.941.34 1.786.805 2.496 1.403a5.002 5.002 0 00-4.864 4.886c-.348.032-.687.058-1.028.084a4.997 4.997 0 01-.474-.032zm-2.007.775a4.997 4.997 0 004.48 0 4.997 4.997 0 004.48 0z"/>
                </svg>
              </Link>
              <Link href="https://instagram.com" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">انستغرام</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.012 4.871.07 3.252.07-3.252-.07-4.871-.07-3.252.07zm3.98 10.638v4.896h-2.846v-4.896c0-.547-.023-1.25-.511-1.25-1.489v-2.504c0-.541.468-.547 1.005-.547.541 0 1.05.006 1.542.006v2.504c0 1.029-.379 1.489-1.25 1.489h-2.846v-5.502c0-2.734-2.108-4.23-4.815-4.23h-5.502v-1.76h5.502c3.904 0 6.861 3.01 6.861 7.086z"/>
                </svg>
              </Link>
              <Link href="https://youtube.com" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">يوتيوب</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 4.502 3.545c-4.901 0-16.496.05-16.496 3.05a3.016 3.016 0 00-2.122 2.136C3.473 10.17 3.5 17.764 3.5 20.5v2.984c0 .35.027.362.063.386.145.509 0 1.337 0 3.993 0 5.332-.086.822-.363 1.18-.765 1.506-.029-.614-.029-1.25 0-1.891 1.086-2.984 2.246-2.984 2.25 0 3.992-.026 5.34-.106.81-.363 1.166-.765 1.49-.321.293-.711.459-1.134.495.436.148.95.273 1.592.273-.914.522-1.716.826-2.021.826z"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}