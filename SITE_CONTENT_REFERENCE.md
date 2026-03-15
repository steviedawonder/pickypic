# PICKY-PIC.COM - Complete Site Content Reference

> Extracted from https://picky-pic.com on 2026-03-15

---

## GLOBAL ELEMENTS (Shared Across All Pages)

### Site Meta
- **Title Pattern**: `{페이지명} 페이지 | 피키픽 | 포토부스 대여 및 기업 행사 렌탈 전문`
- **Analytics**: Google Tag Manager `GTM-KDRFNN4H`, WebCollect `wcs_add["wa"] = "s_4802d3026ad7"`
- **Font Family**: `'Noto Sans KR', 'Montserrat', sans-serif`
- **Max Container Width**: 1440px
- **CMS**: Gnuboard5 (g5) with SmartEditor2

### Global JS Variables
```javascript
var g5_url = "https://picky-pic.com"
var g5_bbs_url = "https://picky-pic.com/bbs"
var g5_plugin_url = "https://picky-pic.com/plugin"
```

### Logo Images
- **Header Logo**: `https://picky-pic.com/theme/BS4-Basic/storage/image/logo-logo-top.png`
- **Footer Logo**: `https://picky-pic.com/img/custom/footer_logo.png`
- **Language Icon**: `https://picky-pic.com/img/custom/lang.png`

### Main Navigation Menu
| Label | URL |
|---|---|
| 회사소개 (Company Info) | `/bbs/board.php?bo_table=company` |
| 제품소개 (Products) | `/bbs/board.php?bo_table=products` |
| 렌탈문의 (Rental Inquiry) | `/bbs/board.php?bo_table=rental` |
| 포트폴리오 (Portfolio) | `/bbs/board.php?bo_table=portfolio` |
| 고객지원 (Customer Support) | `/bbs/board.php?bo_table=support` |
| A.I 퍼스널컬러 (AI Personal Color) | `/bbs/board.php?bo_table=New` |

### Language Options
- KO (Korean) | JP (Japanese) | EN (English)
- Language switch via AJAX POST to `/lang_session.php`

### Mobile Menu Structure
- `.mobile-menu-container` with `.main-menu-row` and `.sub-menu-row`
- Horizontal scrollable menus with auto-centering on active item
- Animation: `@keyframes fadein { from { opacity:0; transform:translateY(-5px) } }`
- Z-index stack: sticky wrap (1) < mobile menu (2) < underline (5)

### CSS Key Classes
- `.nt-container`, `.nt-container-wide` (max-width: 1440px)
- `.boxed.wrapper`, `.wrapper`
- `#nt_header`, `#nt_menu`, `#nt_body`, `#nt_footer`
- `#nt_menu_wrap`, `#nt_sticky_wrap`
- `.me-sticky`, `.nav-slide`, `.me-sw` (width: 150px)
- `.lang-select`, `.lang`

### Footer Content
```
Company Information:
- 상호: 주식회사 피키글로벌 (Picky Global Ltd.)
- 사업자등록번호: 772-86-02811
- 주소: 서울시 성동구 성수이로18길 31, 602호
- 전화번호: (82) 02-338-9181
- Copyright: © 2025 Picky Global Ltd. All rights reserved.

Follow Us:
- 카카오톡 채널: @피키픽 포토부스
- Instagram: pickypic.official, picky.global, pickypic.sg

Contact:
- TEL: (82) 02-338-9181 (tel:82023389181)
- E-MAIL: pickypic.photobooth@gmail.com
- 협업제안: pickypic.marketing@gmail.com
```

### Responsive Breakpoints
- 0px, 575px, 767px, 991px, 1199px
- Mobile title font: 32px (desktop: 52px)
- Mobile subtitle: 14px (desktop: 18px)
- Mobile button padding: 10px 24px (desktop: 18px 60px)
- Mobile button font-size: 14px (desktop: 18px)

---

## PAGE 1: HOMEPAGE (/)

### Page Title
`피키픽 | 포토부스 대여 및 기업 행사 렌탈 전문`

### Hero Carousel (Desktop)
ID: `#carousel_qrexkjgwnpmshvcdutfiol`
- Aspect ratio: 55% padding-bottom
- Content overlay: positioned at 50% top, 25% left

**Slide Images (Desktop):**
1. `https://picky-pic.com/theme/BS4-Basic/storage/image/title-main-1.jpg`
2. `https://picky-pic.com/theme/BS4-Basic/storage/image/title-main-2.jpg`
3. `https://picky-pic.com/theme/BS4-Basic/storage/image/title-main-3.jpg`

### Hero Carousel (Mobile)
ID: `#carousel_nfrvehtmijpdswglukoq`
- Aspect ratio: 100% padding-bottom
- Overlay: 20% top, 50% left

**Slide Images (Mobile):**
1. `https://picky-pic.com/theme/BS4-Basic/storage/image/title-main_mo01.jpg`
2. `https://picky-pic.com/theme/BS4-Basic/storage/image/title-main-mo2.jpg`
3. `https://picky-pic.com/theme/BS4-Basic/storage/image/title-main-mo3.jpg`

### Overlay Content
- Logo image: `/img/custom/main-title.png` (desktop), `/img/custom/main-title-mo.png` (mobile)
- CSS classes: `.main-visual-overlay`, `.main-visual-overlay-mo`
- Elements: `.title`, `.subtitle`, `.main-btn-group`, `.btn`

### CTA Buttons
| Label | URL |
|---|---|
| 제품소개 (Products) | `/bbs/board.php?bo_table=products` |
| 렌탈문의 (Rental Inquiry) | `/bbs/board.php?bo_table=rental` |
| 구매문의 (Purchase) | `https://smartstore.naver.com/pickypicphoto` |

Mobile button dimensions: 93px width x 38px height, flex-wrap

### Popup Element
- Image: `https://picky-pic.com/data/editor/2603/344123c9e652c245bdf6f72318220fb7_1772506600_4604.png`
- Classes: `.hd_pops`, `.popup`, `.newwin`, `.hd_pops_reject`, `.hd_pops_close`
- `#hd` z-index: 1000
- 24-hour dismissal with cookie storage
- Click handler redirects to products board

---

## PAGE 2: COMPANY / ABOUT (/bbs/board.php?bo_table=company)

### Page Title
`피키픽 | 포토부스 대여 및 기업 행사 렌탈 전문`

### Carousel 1 (Desktop)
ID: `#carousel_cujhwfopneqdilmkvrgst`
- Image: `https://picky-pic.com/theme/BS4-Basic/storage/image/title-1.jpg`
- Aspect ratio: 48% padding-bottom

### Carousel 2 (Mobile)
ID: `#carousel_hegmnudivscprfjktqlob`
- Image: `https://picky-pic.com/theme/BS4-Basic/storage/image/title-회사소개 페이지 메인사진.jpg`
- Aspect ratio: 150% padding-bottom

### CTA Buttons
| Label | Action |
|---|---|
| 회사소개 (Company Intro) | PDF Download |
| 제품소개 (Products) | Link to products |
| 협업제안 (Collaboration) | Link to `/bbs/board.php?bo_table=collaboration` |

### PDF Downloads (Company Introduction)
Base path: `https://picky-pic.com/data/download/`
- Korean: `PICKYPIC_회사소개서_KR(2025ver)_ko_20251231165559.pdf`
- Japanese: `PICKYPIC_Company_Introduction_JP(2025ver)_jp_20251231165559.pdf`
- English: `PICKYPIC_Company_Introduction_EN(2025ver)_en_20251231165559.pdf`

### Notes
- No visible company history, team info, statistics, timelines, or partner logos
- Page primarily features hero carousel with download links

---

## PAGE 3: PRODUCTS (/bbs/board.php?bo_table=products)

### Page Title
`제품소개 페이지 | 피키픽 | 포토부스 대여 및 기업 행사 렌탈 전문`

### Product Carousel
- Uses owlCarousel: `autoplay:false`, `loop:true`, `items:1`, `margin:12`
- Navigation arrows: `/img/custom/left.png`, `/img/custom/right.png`
- Responsive across all breakpoints (0px-1199px+)

### 9 Product Models
| # | Korean Name | English Name | Image |
|---|---|---|---|
| 1 | 모던피키 | Modern Picky | `thumb-title-1_2800x1600.png` |
| 2 | 클래식피키 | Classic Picky | `thumb-title-2_2800x1600.png` |
| 3 | 어반피키 | Urban Picky | `thumb-title-3_2800x1600.png` |
| 4 | 모던 미니피키 | Modern Mini Picky | `thumb-title-4_2800x1600.png` |
| 5 | 어반 미니피키 | Urban Mini Picky | `thumb-title-5_2800x1600.png` |
| 6 | 모던 레트로피키 | Modern Retro Picky | `thumb-title-6_2800x1600.png` |
| 7 | 어반 레트로피키 | Urban Retro Picky | `thumb-title-7_2800x1600.png` |
| 8 | 아웃도어피키 | Outdoor Picky | `thumb-title-8_2800x1600.png` |
| 9 | 에어피키 | Air Picky | `thumb-title-9_2800x1600.png` |

Image base URL: `https://picky-pic.com/theme/BS4-Basic/storage/image/`

### Product Introduction Download Section
"제품소개서 다운로드" - Available in Korean, Japanese, English PDF formats
Base path: `https://picky-pic.com/data/download/`

### CSS Classes
- `.owl-carousel`, `#banner_rguqmhflcebsdinajtopk`
- `.sly-wrap`, `.cate-list`
- Category filters trigger carousel slide transitions

---

## PAGE 4: RENTAL INQUIRY (/bbs/board.php?bo_table=rental)

### Page Title
`렌탈문의 페이지 | 피키픽 | 포토부스 대여 및 기업 행사 렌탈 전문`

### Product Types & Dimensions

#### Table Type (테이블형)
| Model | Dimensions |
|---|---|
| 어반 미니 (Urban Mini) | W350 x L350 x H400 |
| 모던 미니 (Modern Mini) | W330 x L330 x H390 [Receipt Camera] |
| 모던 레트로피키 (Modern Retro Picky) | W290 x L290 x H310 |
| 어반 레트로 피키 (Urban Retro Picky) | W190 x L230 x H316 |

#### Stand Type (스탠드형)
| Model | Dimensions |
|---|---|
| 모던 피키 (Modern Picky) | W550 x L550 x H1,570 |
| 클래식 피키 (Classic Picky) | W550 x L550 x H1,570 |
| 어반 피키 (Urban Picky) | W500 x L500 x H1,440 |

#### Booth Type (부스형)
| Model | Dimensions |
|---|---|
| 에어 피키 (Air Picky) | Booth: W930 x L930 x H2,350 / Kiosk: W500 x L600 x H1,200 |
| 아웃도어 피키 (Outdoor Picky) | W1,400 x L1,000 x H2,050 |

### Carousel Product Thumbnails
Base URL: `https://picky-pic.com/theme/BS4-Basic/storage/image/`
- `thumb-title---01_600x550.jpg` through `thumb-title---09_600x550.jpg`
- Owl Carousel: autoplay enabled, pause on hover, dots navigation

### Rental Inquiry Form

#### Required Fields
| Field | Korean Label | Type | Validation |
|---|---|---|---|
| Photo Booth Type | 포토부스 타입 | Checkbox selection | Must select at least one |
| Event Name | 행사명 | Text | Required non-empty |
| Personal/Business Name | 개인 or 사업자명 | Text | Required non-empty |
| Manager Name | 담당자 성함 | Text | Required non-empty |
| Manager Phone | 담당자 연락처 | Phone | Numbers and hyphens only |
| Manager Email | 담당자 이메일 주소 | Email | Standard email format |
| Installation Location | 설치 장소 | Text | Required non-empty |
| Event Schedule | 행사 일정 | Text/Date | Required |
| Removal Schedule | 철거 일정 | Text/Date | Required |
| Wrapping Type | 래핑 진행 여부 | Radio | 래핑 안함 / 레터링 래핑 / 전체 래핑 |
| Shooting Type | 유료/무료 촬영 | Radio | 유료 촬영 / 무료 촬영 / 쿠폰 촬영 / 미정 |
| Additional Inquiries | 기타 문의 사항 | Textarea | Optional |
| Privacy Agreement | 개인정보 수집 및 이용 동의 | Checkbox | Required |

#### Privacy Policy Text
"피키픽 포토부스는 고객님의 렌탈 상담 및 계약 절차를 원활하게 진행하기 위해 개인정보를 수집합니다."
- Collected: business name, industry, installation location, rental dates, preferred booth models
- Retention: 1 year
- Purpose: service provision only

---

## PAGE 5: PORTFOLIO (/bbs/board.php?bo_table=portfolio)

### Page Title
`포트폴리오 페이지 | 피키픽 | 포토부스 대여 및 기업 행사 렌탈 전문`

### Category Filters
| Filter | Korean |
|---|---|
| All | 전체 |
| Modern Picky | 모던피키 |
| Classic Picky | 클래식피키 |
| Urban Picky | 어반피키 |
| Modern Mini Picky | 모던_미니피키 |
| Urban Mini Picky | 어반_미니피키 |
| Modern Retro Picky | 모던_레트로피키 |
| Urban Retro Picky | 어반_레트로피키 |
| Outdoor Picky | 아웃도어피키 |
| Air Picky | 에어피키 |

Category carousel uses Sly plugin with `.sly-wrap`, `.cate-list`, `.ca-prev`, `.ca-next`

### Gallery Layout
- Thumbnail size: 1000x1200px
- Image base URL: `https://picky-pic.com/data/file/portfolio/`
- Pagination: 6 pages total, 15 items per page (except last page)

### All Portfolio Items (77 total across 6 pages)

#### Page 1 (15 items)
| # | Title | wr_id | Thumbnail |
|---|---|---|---|
| 1 | MINI COOPER x PICKYPIC | 111 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_clBIeToQ_dbc7a4c5a6b98e3ec762b6d4faa87c274c415690_1000x1200.jpg` |
| 2 | 찰스앤키스(CHARLESKEITH) x PICKYPIC | 110 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_k4WeJ0Ii_efc62b0266f12b8eb808a7e0028f4302478e4e4c_1000x1200.jpg` |
| 3 | 유한킴벌리(YUHANKIMBERLY) x PICKYPIC | 108 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_kAJjXTGH_8364911a84ca438ce1bca85a020e637d85340a78_1000x1200.jpg` |
| 4 | CORNCENT x PICKYPIC | 107 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_mdB9jKbS_71492543617718f470dd44c636a0d1ce81daadbf_1000x1200.jpg` |
| 5 | KIA x PICKYPIC | 106 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_XakqUC4E_cdf5b63f02010454aa8e486d3bf7c55da4c220ac_1000x1200.jpg` |
| 6 | ZOOLUNGZOOLUNG x PICKYPIC | 105 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_1iZv9gKu_897fca77cdab3e9dab4117923ef691b4eb8169f9_1000x1200.jpg` |
| 7 | HYUNDAI CITY OUTLETS x PICKYPIC | 104 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_zqdgyt1X_167eead844209b24a65d5f73b1aea7ac7e361aab_1000x1200.jpg` |
| 8 | URBANPLAY x PICKYPIC | 103 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_dDm6QpwN_b56887814d5185aa3eec355fbd9ef2c574d13fb5_1000x1200.jpg` |
| 9 | PANACOTA STUDIO x PICKYPIC | 102 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_SY6IzlJH_51cc2be615659c1b69aa38d9b3f1785fde2d1ac4_1000x1200.jpg` |
| 10 | NETFLIX x PICKYPIC | 101 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_NE0xFpcj_aea2e6ec7772a61701ef906f41c06a593423697e_1000x1200.jpg` |
| 11 | rom&nd x PICKYPIC | 94 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_tJvOZ3H0_0aa494b401cb6ee26727ddb52b8fd6870e8d8378_1000x1200.jpg` |
| 12 | THE HYUNDAI PANGYO x PICKYPIC | 92 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_TtgWwy95_4b4bb7088be89752e930a85deefd3013ec339417_1000x1200.jpg` |
| 13 | DAEWOONG x PICKYPIC | 91 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_KCIijFZS_9500aefe01897fe80b00319fefb3e7a85e1b0fb8_1000x1200.jpg` |
| 14 | MINIPOPZ x PICKYPIC | 90 | `thumb-4d831b70dbb51e1a9dd6f31f0a8c3472_95iRjOLN_80da2a7419c6b45ca43a7d56b8730bd4aa353d97_1000x1200.png` |
| 15 | MINIPOPZ x PICKYPIC | 89 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_24ngqkeZ_062d03bcc8eb2552db219f2e54fd84076fba3c5a_1000x1200.jpg` |

#### Page 2 (15 items)
| # | Title | wr_id | Thumbnail |
|---|---|---|---|
| 1 | ILSO x PICKYPIC | 88 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_L9x7GceU_5d7da20ce1c16ba5402b24d7448a1d68678a045e_1000x1200.jpg` |
| 2 | NEW BALANCE x PICKYPIC | 87 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_MRhKe7Fz_5b3a901144aa62eb5193b00bc0db83e50e3f2718_1000x1200.jpg` |
| 3 | THE HYUNDAI SEOUL x PICKYPIC | 86 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_wlxq2Ft1_e281057b1ca00e682316efc2bceb6f5af52aa879_1000x1200.jpg` |
| 4 | THE HYUNDAI SEOUL x PICKYPIC | 85 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_lqn2fboH_0672886127868494fc9a20b2ae61d0ea0c17ca66_1000x1200.jpg` |
| 5 | 소담마켓(SODAM MARKET) x PICKYPIC | 84 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_qEX5Gd7D_adb9b6f8deac91fed7a3af04e3f330c73feee584_1000x1200.jpg` |
| 6 | DEWL x PICKYPIC | 82 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_7ux4Uadj_e17cda99c1415685fc417094bb8a112a724069e6_1000x1200.jpg` |
| 7 | CORNCERT x PICKYPIC | 81 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_2mJIbrpE_6a8acdda29f19988b03e999f38a24dad93e103a1_1000x1200.jpg` |
| 8 | MOVEMENT LAB x PICKYPIC | 80 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_NR6kpi5Z_843af62b78e31d770db01357c48c628554dd3d84_1000x1200.jpg` |
| 9 | CJ ONSTYLE x PICKYPIC | 79 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_CizkG0ED_0613a7b5a71158df62072b3b9c5f33ae5045b12f_1000x1200.jpg` |
| 10 | MUSINSA x PICKYPIC | 78 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_NKqDbJdg_ae0f569c8e6d65b7623a564f9d8a4fce3218e5e6_1000x1200.jpg` |
| 11 | SUE COMMA BONNIE x PICKYPIC | 77 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_hMS39nXj_b15c74150f9b45510adfddc553a41f8625675dad_1000x1200.jpg` |
| 12 | BREAD BARBERSHOP x PICKYPIC | 76 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_Z8U3mkGO_214788d79c8106ae892e561bcf7e1c77d05d5a10_1000x1200.jpg` |
| 13 | PUMPKIN PET x PICKYPIC | 75 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_0GhXbiWK_9b90f9199b0e327b7341ec207478e8b3b815b2da_1000x1200.jpg` |
| 14 | BENJAMIN MOORE x PICKYPIC | 74 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_x9QtEUwG_841da58925159040cfd59d75c7932e5c0c3b755b_1000x1200.jpg` |
| 15 | EIDER x PICKYPIC | 73 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_HiI7ysB8_405ae85267221aecdaf48f1eabc82bb01c7235af_1000x1200.jpg` |

#### Page 3 (15 items)
| # | Title | wr_id | Thumbnail |
|---|---|---|---|
| 1 | MAISON MARGIELA x PICKYPIC | 72 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_nDHBmuOF_34882073399659a16a2ef74a5bd0909cb4336917_1000x1200.jpg` |
| 2 | DECATHLON x PICKYPIC | 71 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_7EDQBU6p_996cc682d2097c1319d09905f5310bf1025beefc_1000x1200.jpg` |
| 3 | MOLANG x PICKYPIC | 70 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_nWaoEfuT_666c0ff4f53dfce016375836d2146bec58494b94_1000x1200.jpg` |
| 4 | HERMES x PICKYPIC | 69 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_nM0WS6gB_1fcf07ac8074a9598a667b79dabb690e569c16a4_1000x1200.jpg` |
| 5 | COCACOLA x PICKYPIC | 68 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_5S2nBCPs_110297c4d47c4ce18141c4ef9a9b17d342e8c06f_1000x1200.jpg` |
| 6 | THE HYUNDAI SEOUL x PICKYPIC | 67 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_XhdlOnYz_5d40a7bfee16911707691d7be4a1cad003d15061_1000x1200.jpg` |
| 7 | COACH x PICKYPIC | 66 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_FDroTn9x_d221800213b34da4591bde600a8d09a3f1f5f495_1000x1200.jpg` |
| 8 | DEMISODA x PICKYPIC | 65 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_pGzsjSTv_c7e96340bfd1584993aa1a41eda3d1d812e68a2d_1000x1200.jpg` |
| 9 | ddd x PICKYPIC | 64 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_a09FhwB6_1bec8a972a677376ca364911ee7ca11267d9a9fa_1000x1200.jpg` |
| 10 | NETFLIX x PICKYPIC | 63 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_ldVRyEW6_25f9bd326592760c123dfc3f0c7862bc555c4d01_1000x1200.jpg` |
| 11 | THE HYUNDAI DAEGU x PICKYPIC | 62 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_vKoqfSux_62a0086112ae32339616c3c5c0dc0922f01fea2f_1000x1200.jpg` |
| 12 | OUR x PICKYPIC | 61 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_BG6YLTjW_516c51cc5bc09a418f681a469ed213f40b713407_1000x1200.jpg` |
| 13 | AMADANG x PICKYPIC | 60 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_jw9Mk0oH_b820a8ee7c9ed904df640a2bbd348472ecac1288_1000x1200.jpg` |
| 14 | MANYO x PICKYPIC | 59 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_twfL1erC_9724c660374eb1f6f0dd925f884056a7dd231815_1000x1200.jpg` |
| 15 | BOSS x PICKYPIC | 58 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_pLt6bE35_e0208ea3a2f1d51b92bc5867e69c2c2d421ba029_1000x1200.jpg` |

#### Page 4 (15 items)
| # | Title | wr_id | Thumbnail |
|---|---|---|---|
| 1 | SUPY x PICKYPIC | 51 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_nKF6gB23_dc126788bc6d0b3de8f7571d8a162f640321417f_1000x1200.jpg` |
| 2 | VUNQUE x PICKYPIC | 50 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_iArJep9Y_2807b6c56ea1a9e3d9f12784c09771d4308fc6c2_1000x1200.jpg` |
| 3 | GALAXY x PICKYPIC | 49 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_PbGyflvA_990958460124984b080f80d4482d89117b5e1aed_1000x1200.jpg` |
| 4 | OLIVEYOUNG x PICKYPIC | 48 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_v8w4Me7l_2aee0f830b34ed6276b7b8a8fd8295e38656bed6_1000x1200.jpg` |
| 5 | GOOGLE x PICKYPIC | 47 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_CmBn2hFe_f6c210c35ddc38a51acf8d685abd3de37615eb4b_1000x1200.jpg` |
| 6 | MOVEMENT LAB x PICKYPIC | 46 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_yzYjncbm_ed88781936f710ccdcb567023f8f1b18f4411c4e_1000x1200.jpg` |
| 7 | RITTEN x PICKYPIC | 45 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_FLVCwD4Q_b5329927fde7a51f58c0f8342166184629da4a75_1000x1200.jpg` |
| 8 | BBLAB x PICKYPIC | 44 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_Et0QJVDC_79ccb71d8f8573fd81cd7bbc2cfd80624aa4ef72_1000x1200.jpg` |
| 9 | SUPY x PICKYPIC | 43 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_LHAXjFg9_a059840ac269d1bf3f84bb968617a89fded9a7cf_1000x1200.jpg` |
| 10 | SUNLOVE x PICKYPIC | 42 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_CnND6Q8v_b2f5eb9c33f919cfa82fc0d0a4574dd526e6b337_1000x1200.jpg` |
| 11 | NEUTROGENA x PICKYPIC | 41 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_kbUDNmWd_49c56a460a78f3d3811434427f478e0bb182b209_1000x1200.jpg` |
| 12 | KLAIRS x PICKYPIC | 40 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_b5rQcH9T_34204017d54d0c8db6cae95edd122a49758b1ed0_1000x1200.jpg` |
| 13 | JOHNNIE WALKER x PICKYPIC | 39 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_QevwIAmT_4834da629fc3ea2c7baf094fd9fc570a9ffaf794_1000x1200.jpg` |
| 14 | AYUNCHE x PICKYPIC | 38 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_S1yjEwTq_aeb7b751a826cbb7f8ae424dbfd9f6614bea3c0e_1000x1200.jpg` |
| 15 | BBIA x PICKYPIC | 37 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_RfNMDAj4_ef13f568bbb1948d33e7499d6ee5dfad96822e61_1000x1200.jpg` |

#### Page 5 (14 items)
| # | Title | wr_id | Thumbnail |
|---|---|---|---|
| 1 | GAMJABATT x PICKYPIC | 34 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_YS3Aa1wI_0d398f6eef4271fa039ee7777b655fd301e8f73e_1000x1200.jpg` |
| 2 | THE HYUNDAI x PICKYPIC | 33 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_dOyUefzq_712c22d000a5fb478d3c97eecab828f348204d25_1000x1200.jpg` |
| 3 | DYSON x PICKYPIC | 32 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_bE2oYrGT_d87c8ce7232eefb616854e5d1fc649f531f48107_1000x1200.jpg` |
| 4 | 3PAGES x PICKYPIC | 30 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_fHG2mjPZ_3ac96f90a2e84d21ce97d2b59ccaef0559da5b8a_1000x1200.jpg` |
| 5 | TAG x PICKYPIC | 29 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_hYyja2WN_6508903f088ae71d844577cf994204c149d0c266_1000x1200.png` |
| 6 | HCOFFEE x PICKYPIC | 28 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_jyBa0ApD_59bea6d27b4d640dc2f25b9130e4697581320a38_1000x1200.png` |
| 7 | CORNCERT x PICKYPIC | 27 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_UEWryNpX_f47b1e3ee9e24146087281813b4088038b188330_1000x1200.png` |
| 8 | VUNQUE x PICKYPIC | 26 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_njuqgcY0_2f4750e6ba8d2127ca407f8de6493eacb5c7bf9f_1000x1200.png` |
| 9 | TWB x PICKYPIC | 24 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_WgQ6UT9d_1ee056bdca2ea6bf6e79089ecb39b7b28e03c146_1000x1200.png` |
| 10 | LOE x PICKYPIC | 23 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_gNd9o7F4_675972d40967f82ffe7acad3df26b252982eb67a_1000x1200.png` |
| 11 | POTLER x PICKYPIC | 22 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_ADtG8p7N_90e8b1caecb8291391985718e92485fe78e70298_1000x1200.png` |
| 12 | ANANTI BUSAN x PICKYPIC | 13 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_Hux9tKpD_4c387f3225cb08d9d1955c8b9b54fa06c93c4cb8_1000x1200.jpg` |
| 13 | THE HYUNDAI SEOUL x PICKYPIC | 12 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_4FtEvu6P_126420ad3b5ecb5b577ca1c5c883fe3008c2ef8b_1000x1200.jpg` |
| 14 | STARBUCKS x PICKYPIC | 11 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_Nsk4gzhF_8ce26027cb5f378f27e6e25d4e5ccfe2d954a50b_1000x1200.jpg` |

#### Page 6 (2 items)
| # | Title | wr_id | Thumbnail |
|---|---|---|---|
| 1 | GRANOLGY x PICKYPIC | 9 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_bXoU27cR_43dde63661668bb7041fc744c9ff664cd2cad14f_1000x1200.jpg` |
| 2 | AIR BUSAN x PICKYPIC | 8 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_KqI97pcm_a91b7e943ff981248e460f59e4a2e94b8fb8f376_1000x1200.jpg` |

---

## PAGE 6: CUSTOMER SUPPORT (/bbs/board.php?bo_table=support)

### Page Title
`고객지원 페이지 | 피키픽 | 포토부스 대여 및 기업 행사 렌탈 전문`

### Section Title
"고객지원" (Customer Support)

### Section Subtitle
"피키픽 포토부스 가이드파일 다운로드" (Download Picky Pic Photo Booth Guide Files)

### Category Filters
- 전체 (All)
- 부스형 (Booth Type)
- 스탠드형 (Stand Type)
- 테이블형 (Table Type)

### Product Gallery (9 items)
Image base URL: `https://picky-pic.com/data/file/support/`

| # | Product Name | wr_id | Thumbnail |
|---|---|---|---|
| 1 | 모던피키 | 41 | `thumb-9_copy_41_4a50c8f5473a371bda0a07e47c8fb56a_RBytJFpK_3f4d7228fce652d233905b23d03983d969326c88_945x936.png` |
| 2 | 클래식피키 | 39 | `thumb-4a50c8f5473a371bda0a07e47c8fb56a_3BA57WmQ_e07974cd82b1bfc3659030423c89d32379cb1ce4_945x936.png` |
| 3 | 어반피키 | 38 | `thumb-24_copy_38_4a50c8f5473a371bda0a07e47c8fb56a_uf7VURyG_6de830a186d4ebf8ac0346762eff214995c7d599_945x936.png` |
| 4 | 모던 미니피키 | 37 | `thumb-25_copy_37_4a50c8f5473a371bda0a07e47c8fb56a_rav3FYt0_499be1d11b85d840d5d258f07af46cd0437f71b8_945x936.png` |
| 5 | 어반 미니피키 | 36 | `thumb-26_copy_36_4a50c8f5473a371bda0a07e47c8fb56a_xqHbEDdU_eb5f580ffb54e707b102cbaf3254174147aeaa6a_945x936.png` |
| 6 | 모던 레트로피키 | 35 | `thumb-28_copy_35_4a50c8f5473a371bda0a07e47c8fb56a_nPZp6USF_51b9dce22e5cee59406686f67951e0915e438d3b_945x936.png` |
| 7 | 어반 레트로피키 | 34 | `thumb-29_copy_34_4a50c8f5473a371bda0a07e47c8fb56a_DX8cUR1A_39b75be8301f74210deda7c269f18746cfbdda4a_945x936.png` |
| 8 | 아웃도어피키 | 33 | `thumb-30_copy_33_4a50c8f5473a371bda0a07e47c8fb56a_Oo7zFqGa_cbfe49d1b4e35a8c1786826e336e1698e92bc56e_945x936.png` |
| 9 | 에어피키 | 32 | `thumb-31_copy_32_4a50c8f5473a371bda0a07e47c8fb56a_b60MCjpB_c6bce4315adfb79bf80745ce26623c70c9083395_945x936.png` |

### Layout
- Product thumbnails: 945x936px
- Horizontal scrolling container with `.client-wrap`
- Uses jQuery Sly plugin for carousel
- Clicking a product links to: `/bbs/board.php?bo_table=support&wr_id={id}` (individual guide download page)

---

## TECHNICAL NOTES

### CMS Platform
- Gnuboard5 (Korean CMS) with BS4-Basic theme
- Board tables: company, products, rental, portfolio, support, New, collaboration
- Editor: SmartEditor2

### URL Patterns
- Content pages: `/bbs/content.php?co_id={page}` (returned errors - not used)
- Board pages: `/bbs/board.php?bo_table={table}` (actual working URLs)
- File storage: `/data/file/{table}/` for uploaded images
- Theme assets: `/theme/BS4-Basic/storage/image/` for theme images
- Custom images: `/img/custom/` for custom assets
- Downloads: `/data/download/` for PDF files

### Libraries Used
- jQuery
- Owl Carousel (product sliders)
- Sly (category filter carousels)
- SmartEditor2 (form editor)
- Google Tag Manager
- WebCollect Analytics (Naver)

### Color Scheme
- Text primary: #000
- Text secondary: #666
- Text tertiary: #a2a2a2
- Background (mobile menu): #f5f5f5
- Border: 1px solid #A2A2A2
- Transitions: 0.25s to 0.3s ease
