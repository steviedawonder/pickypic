export type Lang = 'ko' | 'en' | 'jp';

export const translations: Record<Lang, Record<string, string>> = {
  ko: {
    // Navigation
    'nav.about': '회사소개',
    'nav.products': '제품소개',
    'nav.rental': '렌탈문의',
    'nav.portfolio': '포트폴리오',
    'nav.support': '고객지원',
    'nav.ai': 'A.I 퍼스널컬러',
    'nav.blog': '블로그',
    'nav.contact_phone': '문의전화',

    // Hero
    'hero.products': '제품소개',
    'hero.rental': '렌탈문의',
    'hero.purchase': '구매문의',

    // Why PickyPic
    'why.title': '피키픽을 선택하는 이유',
    'why.description': '다양한 포토부스 라인업과 전문 운영 노하우로 특별한 순간을 완성합니다.',
    'why.stat1.label': '포토부스 모델',
    'why.stat1.desc': '테이블형부터 부스형까지 다양한 라인업',
    'why.stat2.label': '누적 이벤트',
    'why.stat2.desc': '브랜드, 기업, 파티 등 다양한 현장',
    'why.stat3.label': '빠른 응대',
    'why.stat3.desc': '업무시간 기준 1시간 이내 응답',
    'why.feature1.title': '맞춤형 디자인',
    'why.feature1.desc': '브랜드 아이덴티티에 맞는 래핑, 레터링, 프레임 커스터마이징',
    'why.feature2.title': '즉석 인화',
    'why.feature2.desc': '고화질 즉석 프린트로 현장에서 바로 추억을 간직',
    'why.feature3.title': '디지털 공유',
    'why.feature3.desc': 'QR코드를 통한 간편한 디지털 사진 공유',
    'why.feature4.title': '전문 운영팀',
    'why.feature4.desc': '설치부터 운영, 철수까지 전담 스태프가 책임 관리',

    // Footer
    'footer.company_label': '상호',
    'footer.business_number': '사업자등록번호',
    'footer.address_label': '주소',
    'footer.phone_label': '전화번호',
    'footer.partnership': '협업제안',
    'footer.kakao': '카카오톡 채널',

    // Floating Button
    'floating.rental': '렌탈문의',
    'floating.kakao': '카카오톡 상담',

    // About Page
    'about.title': '회사소개 페이지 | 피키픽 | 포토부스 대여 및 기업 행사 렌탈 전문',
    'about.btn_company': '회사소개',
    'about.btn_products': '제품소개',
    'about.btn_partnership': '협업제안',

    // Products Page
    'products.title': '제품소개',

    // Portfolio Page
    'portfolio.no_results': '검색 결과가 없습니다.',
    'portfolio.photobooth_rental': '포토부스 렌탈',
    'portfolio.inquiry_guide': '하단 문의하기 클릭 시, 바로 비용 문의가 가능합니다.',
    'portfolio.inquiry_button': '이 포트폴리오와 동일한 기기 렌탈 비용 문의하기',

    // Support Page
    'support.title': '고객지원',
    'support.subtitle': '피키픽 포토부스 가이드파일 다운로드',
    'support.no_results': '검색 결과가 없습니다.',
    'support.cat_all': '전체',
    'support.cat_booth': '부스형',
    'support.cat_stand': '스탠드형',
    'support.cat_table': '테이블형',

    // Rental Page
    'rental.inquiry_title': '렌탈 문의',
    'rental.inquiry_desc': '희망하시는 렌탈 내용을 아래 양식에 맞춰 작성 부탁드립니다!<br />해당 부서에서 순차적으로 답변드릴 예정입니다. (영업 시간 기준 1시간 이내)',
    'rental.booth_type': '포토부스 타입',
    'rental.table_type': '1. 테이블형',
    'rental.stand_type': '2. 스탠드형',
    'rental.booth_type_3': '3. 부스형',
    'rental.urban_mini': '어반 미니',
    'rental.modern_mini': '모던 미니',
    'rental.receipt_modern_retro': '[영수증 사진기] 모던 레트로피키',
    'rental.urban_retro': '어반 레트로 피키',
    'rental.modern_picky': '모던 피키',
    'rental.classic_picky': '클래식 피키',
    'rental.urban_picky': '어반 피키',
    'rental.air_picky': '에어 피키',
    'rental.outdoor_picky': '아웃도어 피키',
    'rental.event_name': '행사명',
    'rental.event_name_placeholder': '행사명을 입력해주세요',
    'rental.company_name': '개인 or 사업자명',
    'rental.company_name_placeholder': '개인명 또는 사업자명을 입력해주세요',
    'rental.contact_name': '담당자 성함',
    'rental.contact_name_placeholder': '담당자 성함을 입력해주세요',
    'rental.contact_phone': '담당자 연락처',
    'rental.contact_email': '담당자 이메일 주소',
    'rental.install_location': '설치 장소',
    'rental.install_location_placeholder': '설치 장소 주소를 입력해주세요',
    'rental.event_schedule': '행사 일정',
    'rental.removal_schedule': '철거 일정',
    'rental.wrapping': '래핑 진행 여부',
    'rental.wrapping_none': '래핑 안함',
    'rental.wrapping_lettering': '레터링 래핑',
    'rental.wrapping_full': '전체 래핑',
    'rental.shooting_type': '유료/무료 촬영',
    'rental.shooting_paid': '유료 촬영',
    'rental.shooting_free': '무료 촬영',
    'rental.shooting_coupon': '쿠폰 촬영',
    'rental.shooting_undecided': '미정',
    'rental.additional': '기타 문의 사항',
    'rental.additional_placeholder': '기타 문의 사항이 있으시면 자유롭게 작성해주세요.',
    'rental.privacy_title': '[필수] 개인정보 수집 및 이용 동의',
    'rental.privacy_desc': '수집 항목: 성함, 연락처, 이메일, 소속/회사명<br />수집 목적: 렌탈 문의 상담 및 답변<br />보유 기간: 문의 접수 후 상담 완료 시까지 (최대 1년)<br />동의를 거부하실 수 있으나, 거부 시 렌탈 문의가 제한됩니다.',
    'rental.submit': '문의하기',
    'rental.submitting': '전송 중...',

    // Form validation
    'validation.booth_required': '포토부스 타입을 1개 이상 선택해주세요.',
    'validation.required': '필수 입력 항목입니다.',
    'validation.email': '올바른 이메일 주소를 입력해주세요.',
    'validation.phone': '올바른 연락처를 입력해주세요. (예: 010-0000-0000)',
    'validation.select_required': '항목을 선택해주세요.',
    'validation.privacy_required': '개인정보 수집 및 이용에 동의해주세요.',
    'validation.success': '문의가 접수되었습니다. 담당자가 빠르게 연락드리겠습니다.',
    'validation.error': '전송에 실패했습니다. 잠시 후 다시 시도해주세요.\n또는 pickypic.photobooth@gmail.com으로 직접 문의해주세요.',
  },

  en: {
    // Navigation
    'nav.about': 'About',
    'nav.products': 'Products',
    'nav.rental': 'Rental Inquiry',
    'nav.portfolio': 'Portfolio',
    'nav.support': 'Support',
    'nav.ai': 'A.I Personal Color',
    'nav.blog': 'Blog',
    'nav.contact_phone': 'Contact',

    // Hero
    'hero.products': 'Products',
    'hero.rental': 'Rental',
    'hero.purchase': 'Purchase',

    // Why PickyPic
    'why.title': 'Why Choose PickyPic',
    'why.description': 'We create special moments with a diverse photo booth lineup and professional operation know-how.',
    'why.stat1.label': 'Photo Booth Models',
    'why.stat1.desc': 'Diverse lineup from table to booth types',
    'why.stat2.label': 'Cumulative Events',
    'why.stat2.desc': 'Various venues including brands, corporates, and parties',
    'why.stat3.label': 'Fast Response',
    'why.stat3.desc': 'Response within 1 hour during business hours',
    'why.feature1.title': 'Custom Design',
    'why.feature1.desc': 'Wrapping, lettering, and frame customization to match brand identity',
    'why.feature2.title': 'Instant Print',
    'why.feature2.desc': 'Keep memories on the spot with high-quality instant prints',
    'why.feature3.title': 'Digital Sharing',
    'why.feature3.desc': 'Easy digital photo sharing via QR code',
    'why.feature4.title': 'Professional Team',
    'why.feature4.desc': 'Dedicated staff responsible from installation to operation and removal',

    // Footer
    'footer.company_label': 'Company',
    'footer.business_number': 'Business No.',
    'footer.address_label': 'Address',
    'footer.phone_label': 'Phone',
    'footer.partnership': 'Partnership',
    'footer.kakao': 'KakaoTalk Channel',

    // Floating Button
    'floating.rental': 'Rental Inquiry',
    'floating.kakao': 'KakaoTalk Chat',

    // About Page
    'about.title': 'About | PICKYPIC | Photo Booth Rental & Corporate Event Specialist',
    'about.btn_company': 'About Us',
    'about.btn_products': 'Products',
    'about.btn_partnership': 'Partnership',

    // Products Page
    'products.title': 'Products',

    // Portfolio Page
    'portfolio.no_results': 'No results found.',
    'portfolio.photobooth_rental': 'Photo Booth Rental',
    'portfolio.inquiry_guide': 'Click below to get an instant quote for rental costs.',
    'portfolio.inquiry_button': 'Inquire about rental costs for this model',

    // Support Page
    'support.title': 'Support',
    'support.subtitle': 'Download PickyPic Photo Booth Guide Files',
    'support.no_results': 'No results found.',
    'support.cat_all': 'All',
    'support.cat_booth': 'Booth',
    'support.cat_stand': 'Stand',
    'support.cat_table': 'Table',

    // Rental Page
    'rental.inquiry_title': 'Rental Inquiry',
    'rental.inquiry_desc': 'Please fill out the form below with your desired rental details!<br />Our team will respond in order. (Within 1 hour during business hours)',
    'rental.booth_type': 'Photo Booth Type',
    'rental.table_type': '1. Table Type',
    'rental.stand_type': '2. Stand Type',
    'rental.booth_type_3': '3. Booth Type',
    'rental.urban_mini': 'Urban Mini',
    'rental.modern_mini': 'Modern Mini',
    'rental.receipt_modern_retro': '[Receipt Printer] Modern Retro Picky',
    'rental.urban_retro': 'Urban Retro Picky',
    'rental.modern_picky': 'Modern Picky',
    'rental.classic_picky': 'Classic Picky',
    'rental.urban_picky': 'Urban Picky',
    'rental.air_picky': 'Air Picky',
    'rental.outdoor_picky': 'Outdoor Picky',
    'rental.event_name': 'Event Name',
    'rental.event_name_placeholder': 'Enter event name',
    'rental.company_name': 'Individual or Business Name',
    'rental.company_name_placeholder': 'Enter individual or business name',
    'rental.contact_name': 'Contact Person',
    'rental.contact_name_placeholder': 'Enter contact person name',
    'rental.contact_phone': 'Contact Number',
    'rental.contact_email': 'Contact Email',
    'rental.install_location': 'Installation Location',
    'rental.install_location_placeholder': 'Enter installation address',
    'rental.event_schedule': 'Event Date',
    'rental.removal_schedule': 'Removal Date',
    'rental.wrapping': 'Wrapping Option',
    'rental.wrapping_none': 'No Wrapping',
    'rental.wrapping_lettering': 'Lettering Wrap',
    'rental.wrapping_full': 'Full Wrap',
    'rental.shooting_type': 'Paid/Free Shooting',
    'rental.shooting_paid': 'Paid',
    'rental.shooting_free': 'Free',
    'rental.shooting_coupon': 'Coupon',
    'rental.shooting_undecided': 'Undecided',
    'rental.additional': 'Additional Inquiries',
    'rental.additional_placeholder': 'Please feel free to write any additional inquiries.',
    'rental.privacy_title': '[Required] Consent to Collection and Use of Personal Information',
    'rental.privacy_desc': 'Items collected: Name, Contact, Email, Company<br />Purpose: Rental inquiry consultation and response<br />Retention period: Until consultation is completed (up to 1 year)<br />You may refuse consent, but rental inquiry will be restricted.',
    'rental.submit': 'Submit Inquiry',
    'rental.submitting': 'Sending...',

    // Form validation
    'validation.booth_required': 'Please select at least one photo booth type.',
    'validation.required': 'This field is required.',
    'validation.email': 'Please enter a valid email address.',
    'validation.phone': 'Please enter a valid phone number. (e.g., 010-0000-0000)',
    'validation.select_required': 'Please select an option.',
    'validation.privacy_required': 'Please agree to the collection and use of personal information.',
    'validation.success': 'Your inquiry has been submitted. Our team will contact you shortly.',
    'validation.error': 'Failed to send. Please try again later.\nOr contact us directly at pickypic.photobooth@gmail.com.',
  },

  jp: {
    // Navigation
    'nav.about': '会社紹介',
    'nav.products': '製品紹介',
    'nav.rental': 'レンタルお問合せ',
    'nav.portfolio': 'ポートフォリオ',
    'nav.support': 'サポート',
    'nav.ai': 'A.I パーソナルカラー',
    'nav.blog': 'ブログ',
    'nav.contact_phone': 'お問合せ電話',

    // Hero
    'hero.products': '製品紹介',
    'hero.rental': 'レンタル',
    'hero.purchase': '購入',

    // Why PickyPic
    'why.title': 'PickyPicを選ぶ理由',
    'why.description': '多様なフォトブースラインナップと専門運営ノウハウで特別な瞬間を完成させます。',
    'why.stat1.label': 'フォトブースモデル',
    'why.stat1.desc': 'テーブル型からブース型まで多様なラインナップ',
    'why.stat2.label': '累計イベント',
    'why.stat2.desc': 'ブランド、企業、パーティーなど多様な現場',
    'why.stat3.label': '迅速対応',
    'why.stat3.desc': '営業時間基準1時間以内に返答',
    'why.feature1.title': 'カスタムデザイン',
    'why.feature1.desc': 'ブランドアイデンティティに合わせたラッピング、レタリング、フレームカスタマイズ',
    'why.feature2.title': 'インスタントプリント',
    'why.feature2.desc': '高画質インスタントプリントで現場ですぐに思い出を保存',
    'why.feature3.title': 'デジタル共有',
    'why.feature3.desc': 'QRコードで簡単にデジタル写真を共有',
    'why.feature4.title': '専門運営チーム',
    'why.feature4.desc': '設置から運営、撤去まで専任スタッフが責任管理',

    // Footer
    'footer.company_label': '商号',
    'footer.business_number': '事業者登録番号',
    'footer.address_label': '住所',
    'footer.phone_label': '電話番号',
    'footer.partnership': '提携提案',
    'footer.kakao': 'KakaoTalkチャンネル',

    // Floating Button
    'floating.rental': 'レンタルお問合せ',
    'floating.kakao': 'カカオトーク相談',

    // About Page
    'about.title': '会社紹介 | PICKYPIC | フォトブースレンタル＆企業イベント専門',
    'about.btn_company': '会社紹介',
    'about.btn_products': '製品紹介',
    'about.btn_partnership': '提携提案',

    // Products Page
    'products.title': '製品紹介',

    // Portfolio Page
    'portfolio.no_results': '検索結果がありません。',
    'portfolio.photobooth_rental': 'フォトブースレンタル',
    'portfolio.inquiry_guide': '下記ボタンより、レンタル費用をすぐにお問い合わせいただけます。',
    'portfolio.inquiry_button': 'この事例と同じ機種のレンタル費用を問い合わせる',

    // Support Page
    'support.title': 'サポート',
    'support.subtitle': 'PickyPicフォトブースガイドファイルダウンロード',
    'support.no_results': '検索結果がありません。',
    'support.cat_all': '全体',
    'support.cat_booth': 'ブース型',
    'support.cat_stand': 'スタンド型',
    'support.cat_table': 'テーブル型',

    // Rental Page
    'rental.inquiry_title': 'レンタルお問合せ',
    'rental.inquiry_desc': 'ご希望のレンタル内容を以下のフォームにご記入ください！<br />担当部署より順次ご返答いたします。（営業時間基準1時間以内）',
    'rental.booth_type': 'フォトブースタイプ',
    'rental.table_type': '1. テーブル型',
    'rental.stand_type': '2. スタンド型',
    'rental.booth_type_3': '3. ブース型',
    'rental.urban_mini': 'アーバンミニ',
    'rental.modern_mini': 'モダンミニ',
    'rental.receipt_modern_retro': '[レシートプリンター] モダンレトロピキ',
    'rental.urban_retro': 'アーバンレトロピキ',
    'rental.modern_picky': 'モダンピキ',
    'rental.classic_picky': 'クラシックピキ',
    'rental.urban_picky': 'アーバンピキ',
    'rental.air_picky': 'エアピキ',
    'rental.outdoor_picky': 'アウトドアピキ',
    'rental.event_name': 'イベント名',
    'rental.event_name_placeholder': 'イベント名を入力してください',
    'rental.company_name': '個人名または事業者名',
    'rental.company_name_placeholder': '個人名または事業者名を入力してください',
    'rental.contact_name': '担当者名',
    'rental.contact_name_placeholder': '担当者名を入力してください',
    'rental.contact_phone': '担当者連絡先',
    'rental.contact_email': '担当者メールアドレス',
    'rental.install_location': '設置場所',
    'rental.install_location_placeholder': '設置場所の住所を入力してください',
    'rental.event_schedule': 'イベント日程',
    'rental.removal_schedule': '撤去日程',
    'rental.wrapping': 'ラッピングの有無',
    'rental.wrapping_none': 'ラッピングなし',
    'rental.wrapping_lettering': 'レタリングラッピング',
    'rental.wrapping_full': '全面ラッピング',
    'rental.shooting_type': '有料/無料撮影',
    'rental.shooting_paid': '有料撮影',
    'rental.shooting_free': '無料撮影',
    'rental.shooting_coupon': 'クーポン撮影',
    'rental.shooting_undecided': '未定',
    'rental.additional': 'その他お問合せ事項',
    'rental.additional_placeholder': 'その他お問合せがございましたら、ご自由にご記入ください。',
    'rental.privacy_title': '[必須] 個人情報の収集及び利用同意',
    'rental.privacy_desc': '収集項目：氏名、連絡先、メール、所属/会社名<br />収集目的：レンタルお問合せの相談及び回答<br />保有期間：お問合せ受付後、相談完了まで（最大1年）<br />同意を拒否することができますが、拒否時はレンタルお問合せが制限されます。',
    'rental.submit': 'お問合せする',
    'rental.submitting': '送信中...',

    // Form validation
    'validation.booth_required': 'フォトブースタイプを1つ以上選択してください。',
    'validation.required': '必須入力項目です。',
    'validation.email': '正しいメールアドレスを入力してください。',
    'validation.phone': '正しい連絡先を入力してください。（例：010-0000-0000）',
    'validation.select_required': '項目を選択してください。',
    'validation.privacy_required': '個人情報の収集及び利用にご同意ください。',
    'validation.success': 'お問合せが受付されました。担当者より速やかにご連絡いたします。',
    'validation.error': '送信に失敗しました。しばらくしてから再度お試しください。\nまたは pickypic.photobooth@gmail.com まで直接お問合せください。',
  },
};

export function t(key: string, lang: Lang = 'ko'): string {
  return translations[lang]?.[key] ?? translations['ko'][key] ?? key;
}
