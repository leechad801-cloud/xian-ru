export type Book = {
  id: string
  title: string
  author: string
  description: string
  driveUrl: string
}

export type Track = {
  id: string
  title: string
  artist: string
  driveUrl: string
}

export const books: Book[] = [
  {
    id: 'book-01',
    title: '藏书 01',
    author: '私人馆藏',
    description: '为移动阅读准备的沉浸式 PDF 书架体验。',
    driveUrl: 'https://drive.google.com/file/d/11x0CkgoVL3CD3tCagjNJ_-QUR4MPvaiZ/view?usp=drive_link',
  },
  {
    id: 'book-02',
    title: '藏书 02',
    author: '私人馆藏',
    description: '支持进度保存，随时继续阅读。',
    driveUrl: 'https://drive.google.com/file/d/12ujJT8ATryhBGBWQp_io6iemt8zCb1Fl/view?usp=drive_link',
  },
  {
    id: 'book-03',
    title: '藏书 03',
    author: '私人馆藏',
    description: '黑色极简界面，适合夜间阅读。',
    driveUrl: 'https://drive.google.com/file/d/1QU-TxWLdYVQ6Lwh4WonbiWlCxr9Y6Wia/view?usp=drive_link',
  },
  {
    id: 'book-04',
    title: '藏书 04',
    author: '私人馆藏',
    description: '一键回到上次阅读页，保持连续体验。',
    driveUrl: 'https://drive.google.com/file/d/1dn9yRBsqx3pRG4FTjQQz-BjDdcB_fS1c/view?usp=drive_link',
  },
  {
    id: 'book-05',
    title: '藏书 05',
    author: '私人馆藏',
    description: '适配手机宽度的页面渲染与操作控件。',
    driveUrl: 'https://drive.google.com/file/d/1v8wI7l6xaaNmMbwOwrlaxEHC73S9FOY5/view?usp=drive_link',
  },
  {
    id: 'book-06',
    title: '藏书 06',
    author: '私人馆藏',
    description: '保留原始 Google Drive 链接，便于外部打开。',
    driveUrl: 'https://drive.google.com/file/d/1ykO18qKtSN9zOKEJ135BhQScW1QEKF5B/view?usp=drive_link',
  },
]

const musicLinks = [
  'https://drive.google.com/file/d/1g0dsubs_-4DIRQ2xjJ7l0PdK0HDZ7odp/view?usp=drive_link',
  'https://drive.google.com/file/d/1zna2mhofCFkaxj3h2pp4HMEYCx_4S1t5/view?usp=drive_link',
  'https://drive.google.com/file/d/15nqgcZAHEPFzFFLYrCbT_AdNUSKyXNxn/view?usp=drive_link',
  'https://drive.google.com/file/d/1kcUFbJuh0b3AAfQDHOC71EtRkrznb65P/view?usp=drive_link',
  'https://drive.google.com/file/d/1Pj4Iuh7D7T4k6LRargml9DRurA6WKuv1/view?usp=drive_link',
  'https://drive.google.com/file/d/1BeUGjEqLk3rFPNcVdErcYpCSvjVCBRTP/view?usp=drive_link',
  'https://drive.google.com/file/d/13AnAOI-KLE9BkwvRp8Tnd4FPi5D4N3dC/view?usp=drive_link',
  'https://drive.google.com/file/d/1gTSRKkfR4tR3dcAQnzLkFi6Kzd7gJmb9/view?usp=drive_link',
  'https://drive.google.com/file/d/1s--yENgmQT-dUfsFiTbS-lEPbmkzGnoF/view?usp=drive_link',
  'https://drive.google.com/file/d/1iuJfTQ9n30t6hZz-muyw7VlLek5G3xre/view?usp=drive_link',
  'https://drive.google.com/file/d/1u31AjIXN0xuyie1baY-qu4Bf7Fjd3iq6/view?usp=drive_link',
  'https://drive.google.com/file/d/1f4phK2AU_rUgPfAqXUm2mHsXgA8wF-Z0/view?usp=drive_link',
  'https://drive.google.com/file/d/1ngL3dQrRoXVMMcG5bJe_lbA2bAGF9A78/view?usp=drive_link',
  'https://drive.google.com/file/d/1ju_Bvb4RSYU6iWzdAIobWrMNjYeWJ5OI/view?usp=drive_link',
  'https://drive.google.com/file/d/1Mqu_C_Sr9i3IIH3yI6CNaZ4H_Ubtso1o/view?usp=drive_link',
  'https://drive.google.com/file/d/1AJnuagZvtAYK0dXihg8rt-Csl2le7e6P/view?usp=drive_link',
  'https://drive.google.com/file/d/194StG2Hq19NiluPRaX1F_iO6H09oYddX/view?usp=drive_link',
  'https://drive.google.com/file/d/1bt1k2aMmztvlRkdkwc7JJDdncsTmd5Oe/view?usp=drive_link',
  'https://drive.google.com/file/d/1sITW4lIK558EnIEHpfrWT1976XUg7Nbm/view?usp=drive_link',
  'https://drive.google.com/file/d/1a14Ww641RoiOK28SX-d_EaAXpEz2vChq/view?usp=drive_link',
  'https://drive.google.com/file/d/1JtCmVhi4i0TQ3VWnF0O86wKFMzaj68lu/view?usp=drive_link',
  'https://drive.google.com/file/d/1No7CdC_7n_Nf_9SUEJ5puua8_hg16k1s/view?usp=drive_link',
  'https://drive.google.com/file/d/1m-HPmJj3v1_ulbH1N9vF0Ftp3c-VjPBn/view?usp=drive_link',
  'https://drive.google.com/file/d/1glYOuWE98A9jtiI9K1nzuQ97uBRY_TCd/view?usp=drive_link',
  'https://drive.google.com/file/d/1OsVzEIeJ_4iToSvtd9oPAG_W6GFy6kdG/view?usp=drive_link',
  'https://drive.google.com/file/d/1iJFeLhrpWpHP32xGepJSikTUyquGxMiU/view?usp=drive_link',
  'https://drive.google.com/file/d/1-quobtOcFiSHSi6_0KCjWJwhfbCtzgoB/view?usp=drive_link',
  'https://drive.google.com/file/d/1pj8XQJKp6YVMpmD5in6fkzIvOmoO5q3b/view?usp=drive_link',
  'https://drive.google.com/file/d/1S1XP-idVgGAw80ltSEV7EiWQlXFvaZMA/view?usp=drive_link',
  'https://drive.google.com/file/d/1pOg543iXtaUOR2WzVNYGztJR0LTC8WNU/view?usp=drive_link',
  'https://drive.google.com/file/d/1DmkMquqYjdGBSeMYCESPIB_N05XL72OX/view?usp=drive_link',
  'https://drive.google.com/file/d/1H1HyGOU2zimkk7NCHRAi91yCZ6RYW77-/view?usp=drive_link',
  'https://drive.google.com/file/d/1U1hsaJ8ErDnpEoR9UQnvjuPQOFVjgbE6/view?usp=drive_link',
  'https://drive.google.com/file/d/1i0NvHrvU6a_9s7s7_0o7qJDmhhk7deDn/view?usp=drive_link',
  'https://drive.google.com/file/d/1j7P4NepXmi5SsDOHpvtCaD1bTtMnXbXr/view?usp=drive_link',
  'https://drive.google.com/file/d/1NWY8-VkdySu16xL1-xmgbsLjdps-JXA8/view?usp=drive_link',
  'https://drive.google.com/file/d/1ePymjbhziglXy1EMeJiINmjw8ADS7XPu/view?usp=drive_link',
  'https://drive.google.com/file/d/1qBM7_8lg3KVhoUf2wuYwiAMqXsR2yDP6/view?usp=drive_link',
  'https://drive.google.com/file/d/1SqBbTtDrDumpSZezhZiJxAEl6XqdgqNa/view?usp=drive_link',
  'https://drive.google.com/file/d/17meSsgoceVNnems0fLUap-fP9ZE0zUVI/view?usp=drive_link',
  'https://drive.google.com/file/d/1gwzlhlt3egjtRO2dOup5-wkMmBt0kwuz/view?usp=drive_link',
  'https://drive.google.com/file/d/1gHO7NLqnpHulpvldhB6BSzFDZR5tb8o8/view?usp=drive_link',
  'https://drive.google.com/file/d/1tqOS0HmqgAS9dSQC4EB5wtFWf6suZoQv/view?usp=drive_link',
  'https://drive.google.com/file/d/1VRzHAa-wy0p5_Bhrc1SKHHyGCqLBfxM_/view?usp=drive_link',
  'https://drive.google.com/file/d/1Xiby89FZAJ9sEMEAMNpjPZccursMaJ3B/view?usp=drive_link',
  'https://drive.google.com/file/d/1w57PaiXcF34UJbwjO7SC7LTwNjVRLPJt/view?usp=drive_link',
  'https://drive.google.com/file/d/14oUuBnEYMQiWk6p1yaWn7gAR3JyBuVrv/view?usp=drive_link',
  'https://drive.google.com/file/d/1JguGAUkd6TcrCYUHHLuo8KjKCj-xll8b/view?usp=drive_link',
  'https://drive.google.com/file/d/1ve0c2VcaCm7Jr0PtRorku4-dS_i1Dxgd/view?usp=drive_link',
  'https://drive.google.com/file/d/1MjqBJn_5_egI-PxF2ZoRF7ASNONxAW0x/view?usp=drive_link',
  'https://drive.google.com/file/d/1Oy_YMywA9WLw_uhPcZOI0hkq0DYctYcI/view?usp=drive_link',
  'https://drive.google.com/file/d/1N9_2IN8dS6NELL5UoH0RNcXw0ZlQ4gEg/view?usp=drive_link',
  'https://drive.google.com/file/d/1MmmTh7vNt-iuNqLfJew4uF82wk8LM4Fq/view?usp=drive_link',
  'https://drive.google.com/file/d/1pIk4GsFHY2nfO0BHkh816FG9Mim-j-q0/view?usp=drive_link',
  'https://drive.google.com/file/d/10A_7KK4apT1nHLkRp45QWIcZur6RrkCi/view?usp=drive_link',
  'https://drive.google.com/file/d/1bGO2G35oWB42pHSnfElYDKPY4i6GY38l/view?usp=drive_link',
  'https://drive.google.com/file/d/11_WLtlqOu9Es0ILy4oLw7WFICMmR8jQj/view?usp=drive_link',
  'https://drive.google.com/file/d/1rtLuctVBYkibmfj36DqgXuxdq_1JWA6E/view?usp=drive_link',
  'https://drive.google.com/file/d/1btE5Kkhys0OjPy2WdCr2HCdmmQZWYUtJ/view?usp=drive_link',
  'https://drive.google.com/file/d/1Br9bidHHY2tOIozuhv6LCJagJPk6Gdv5/view?usp=drive_link',
  'https://drive.google.com/file/d/14o00pTmojWoDqdKhK2XflBlh-RjPbJxL/view?usp=drive_link',
  'https://drive.google.com/file/d/1E5WYW7b_RAPghz6mglQv80bVnH1KZMkW/view?usp=drive_link',
  'https://drive.google.com/file/d/15tsLlaFXgXWZYf2_R8AsZYEUNyX__Hsn/view?usp=drive_link',
  'https://drive.google.com/file/d/1E6lU4ANfoJnEWX_0EGZHgW5pBllPBMWp/view?usp=drive_link',
  'https://drive.google.com/file/d/1dkfkcvTNlfXb0Mz4VBrI2Xr1wvDIO0NJ/view?usp=drive_link',
  'https://drive.google.com/file/d/1cxLeCJ838YCpY51cujZGw7xdlaC325-D/view?usp=drive_link',
  'https://drive.google.com/file/d/1lf2om9qt0PGgv1Lvkex91v1s9B5uTv_W/view?usp=drive_link',
  'https://drive.google.com/file/d/13WrZU3qXX5XkSDQOKbsh8jr0h68-3fBu/view?usp=drive_link',
  'https://drive.google.com/file/d/11qLggqZAYojpFzEoFlHdVE5Xty-1ycZ4/view?usp=drive_link',
  'https://drive.google.com/file/d/1IsX6MTvD1jOn5lqvX2v3D7flcVZ8rKMs/view?usp=drive_link',
  'https://drive.google.com/file/d/1eG4ESW-8KiBebLX5hNUXNdPispqTbaEi/view?usp=drive_link',
  'https://drive.google.com/file/d/1djARAf0LSx-aIxulHX-O4mzofZRffHNv/view?usp=drive_link',
  'https://drive.google.com/file/d/1zhm30WZMII7jLuMH5yx11WSLoz0bUMS2/view?usp=drive_link',
  'https://drive.google.com/file/d/1iWFz9ocdUzBZj-A4ZVw4o1MEAit3_thh/view?usp=drive_link',
  'https://drive.google.com/file/d/1-BLrHghqv1vChnfCPfutT44XPHILZYTe/view?usp=drive_link',
  'https://drive.google.com/file/d/1gymgXKePtqVcvhfKTH8x2WYmJOi73nP_/view?usp=drive_link',
]

export const tracks: Track[] = musicLinks.map((driveUrl, index) => ({
  id: `track-${String(index + 1).padStart(2, '0')}`,
  title: `曲目 ${String(index + 1).padStart(2, '0')}`,
  artist: 'Google Drive Playlist',
  driveUrl,
}))
