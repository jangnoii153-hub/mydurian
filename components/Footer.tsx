import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black/90 text-white">
      <div className="container mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-16">
        {/* Contact */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold">ติดต่อ</h3>
          <hr className="border-lime-500/30 w-24" />
          <ul className="space-y-4">
            <li className="text-gray-300 hover:text-lime-400 transition-colors cursor-pointer">
              chanin.j@cit.kmutnb.ac.th (ผศ.ดร.ชานินทร์ จูฉิม)
            </li>
            <li className="text-gray-300 hover:text-lime-400 transition-colors cursor-pointer">
              supod.k@cit.kmutnb.ac.th (ผศ.ดร.สุพจน์ แก้วกรณ์)
            </li>
          </ul>
        </div>

        {/* Related Agencies */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold">หน่วยงานที่เกี่ยวข้อง</h3>
          <hr className="border-lime-500/30 w-24" />
          <ul className="space-y-4">
            <li>
              <a
                href="https://www.doae.go.th/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-lime-400 transition-colors"
              >
                กรมส่งเสริมการเกษตร
              </a>
            </li>
            <li>
              <a
                href="https://aic-info.moac.go.th/aic/newsdetail.php?way=PT1nYmxkM2M=&news=PUl6TQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-lime-400 transition-colors"
              >
                AIC นนทบุรี
              </a>
            </li>
            <li>
              <a
                href="https://www.kmutnb.ac.th/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-lime-400 transition-colors"
              >
                มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
              </a>
            </li>
            <li>
              <a
                href="https://cit.kmutnb.ac.th/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-lime-400 transition-colors"
              >
                คณะวิทยาลัยเทคโนโลยีอุตสาหกรรม
              </a>
            </li>
            <li>
              <a
                href="https://cit.kmutnb.ac.th/สาขาวิชาเทคโนโลยีแมคคาทรอนิกส์"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-lime-400 transition-colors"
              >
                สาขาวิศวกรรมแมคคาทรอนิกส์
              </a>
            </li>
          </ul>
        </div>

        {/* Location */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold">สถานที่</h3>
          <hr className="border-lime-500/30 w-24" />
          <ul className="space-y-4">
            <li>
              <a
                href="https://www.google.com/maps/place/มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-lime-400 transition-colors"
              >
                1518 ถนนประชาราษฎร์ 1 แขวงวงศ์สว่าง เขตบางซื่อ กรุงเทพฯ 10800
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="container mx-auto px-8 py-6">
          <p className="text-sm text-gray-400">
            © MyDurian - King Mongkut&apos;s University of Technology North
            Bangkok
          </p>
        </div>
      </div>
    </footer>
  );
}
