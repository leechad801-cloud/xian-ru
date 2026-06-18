export type Book = {
  id: string
  title: string
  summary: string
  sourceUrl: string
  previewUrl: string
}

export type Track = {
  id: string
  title: string
  artist: string
  sourceUrl: string
}

const bookIds = [
  '11x0CkgoVL3CD3tCagjNJ_-QUR4MPvaiZ',
  '12ujJT8ATryhBGBWQp_io6iemt8zCb1Fl',
  '1QU-TxWLdYVQ6Lwh4WonbiWlCxr9Y6Wia',
  '1dn9yRBsqx3pRG4FTjQQz-BjDdcB_fS1c',
  '1v8wI7l6xaaNmMbwOwrlaxEHC73S9FOY5',
  '1ykO18qKtSN9zOKEJ135BhQScW1QEKF5B',
] as const

const trackIds = [
  '1g0dsubs_-4DIRQ2xjJ7l0PdK0HDZ7odp',
  '1zna2mhofCFkaxj3h2pp4HMEYCx_4S1t5',
  '15nqgcZAHEPFzFFLYrCbT_AdNUSKyXNxn',
  '1kcUFbJuh0b3AAfQDHOC71EtRkrznb65P',
  '1Pj4Iuh7D7T4k6LRargml9DRurA6WKuv1',
  '1BeUGjEqLk3rFPNcVdErcYpCSvjVCBRTP',
  '13AnAOI-KLE9BkwvRp8Tnd4FPi5D4N3dC',
  '1gTSRKkfR4tR3dcAQnzLkFi6Kzd7gJmb9',
  '1s--yENgmQT-dUfsFiTbS-lEPbmkzGnoF',
  '1iuJfTQ9n30t6hZz-muyw7VlLek5G3xre',
  '1u31AjIXN0xuyie1baY-qu4Bf7Fjd3iq6',
  '1f4phK2AU_rUgPfAqXUm2mHsXgA8wF-Z0',
  '1ngL3dQrRoXVMMcG5bJe_lbA2bAGF9A78',
  '1ju_Bvb4RSYU6iWzdAIobWrMNjYeWJ5OI',
  '1Mqu_C_Sr9i3IIH3yI6CNaZ4H_Ubtso1o',
  '1AJnuagZvtAYK0dXihg8rt-Csl2le7e6P',
  '194StG2Hq19NiluPRaX1F_iO6H09oYddX',
  '1bt1k2aMmztvlRkdkwc7JJDdncsTmd5Oe',
  '1sITW4lIK558EnIEHpfrWT1976XUg7Nbm',
  '1a14Ww641RoiOK28SX-d_EaAXpEz2vChq',
  '1JtCmVhi4i0TQ3VWnF0O86wKFMzaj68lu',
  '1No7CdC_7n_Nf_9SUEJ5puua8_hg16k1s',
  '1m-HPmJj3v1_ulbH1N9vF0Ftp3c-VjPBn',
  '1glYOuWE98A9jtiI9K1nzuQ97uBRY_TCd',
  '1OsVzEIeJ_4iToSvtd9oPAG_W6GFy6kdG',
  '1iJFeLhrpWpHP32xGepJSikTUyquGxMiU',
  '1-quobtOcFiSHSi6_0KCjWJwhfbCtzgoB',
  '1pj8XQJKp6YVMpmD5in6fkzIvOmoO5q3b',
  '1S1XP-idVgGAw80ltSEV7EiWQlXFvaZMA',
  '1pOg543iXtaUOR2WzVNYGztJR0LTC8WNU',
  '1DmkMquqYjdGBSeMYCESPIB_N05XL72OX',
  '1H1HyGOU2zimkk7NCHRAi91yCZ6RYW77-',
  '1U1hsaJ8ErDnpEoR9UQnvjuPQOFVjgbE6',
  '1i0NvHrvU6a_9s7s7_0o7qJDmhhk7deDn',
  '1j7P4NepXmi5SsDOHpvtCaD1bTtMnXbXr',
  '1NWY8-VkdySu16xL1-xmgbsLjdps-JXA8',
  '1ePymjbhziglXy1EMeJiINmjw8ADS7XPu',
  '1qBM7_8lg3KVhoUf2wuYwiAMqXsR2yDP6',
  '1SqBbTtDrDumpSZezhZiJxAEl6XqdgqNa',
  '17meSsgoceVNnems0fLUap-fP9ZE0zUVI',
  '1gwzlhlt3egjtRO2dOup5-wkMmBt0kwuz',
  '1gHO7NLqnpHulpvldhB6BSzFDZR5tb8o8',
  '1tqOS0HmqgAS9dSQC4EB5wtFWf6suZoQv',
  '1VRzHAa-wy0p5_Bhrc1SKHHyGCqLBfxM_',
  '1Xiby89FZAJ9sEMEAMNpjPZccursMaJ3B',
  '1w57PaiXcF34UJbwjO7SC7LTwNjVRLPJt',
  '14oUuBnEYMQiWk6p1yaWn7gAR3JyBuVrv',
  '1JguGAUkd6TcrCYUHHLuo8KjKCj-xll8b',
  '1ve0c2VcaCm7Jr0PtRorku4-dS_i1Dxgd',
  '1MjqBJn_5_egI-PxF2ZoRF7ASNONxAW0x',
  '1Oy_YMywA9WLw_uhPcZOI0hkq0DYctYcI',
  '1N9_2IN8dS6NELL5UoH0RNcXw0ZlQ4gEg',
  '1MmmTh7vNt-iuNqLfJew4uF82wk8LM4Fq',
  '1pIk4GsFHY2nfO0BHkh816FG9Mim-j-q0',
  '10A_7KK4apT1nHLkRp45QWIcZur6RrkCi',
  '1bGO2G35oWB42pHSnfElYDKPY4i6GY38l',
  '11_WLtlqOu9Es0ILy4oLw7WFICMmR8jQj',
  '1rtLuctVBYkibmfj36DqgXuxdq_1JWA6E',
  '1btE5Kkhys0OjPy2WdCr2HCdmmQZWYUtJ',
  '1Br9bidHHY2tOIozuhv6LCJagJPk6Gdv5',
  '14o00pTmojWoDqdKhK2XflBlh-RjPbJxL',
  '1E5WYW7b_RAPghz6mglQv80bVnH1KZMkW',
  '15tsLlaFXgXWZYf2_R8AsZYEUNyX__Hsn',
  '1E6lU4ANfoJnEWX_0EGZHgW5pBllPBMWp',
  '1dkfkcvTNlfXb0Mz4VBrI2Xr1wvDIO0NJ',
  '1cxLeCJ838YCpY51cujZGw7xdlaC325-D',
  '1lf2om9qt0PGgv1Lvkex91v1s9B5uTv_W',
  '13WrZU3qXX5XkSDQOKbsh8jr0h68-3fBu',
  '11qLggqZAYojpFzEoFlHdVE5Xty-1ycZ4',
  '1IsX6MTvD1jOn5lqvX2v3D7flcVZ8rKMs',
  '1eG4ESW-8KiBebLX5hNUXNdPispqTbaEi',
  '1djARAf0LSx-aIxulHX-O4mzofZRffHNv',
  '1zhm30WZMII7jLuMH5yx11WSLoz0bUMS2',
  '1iWFz9ocdUzBZj-A4ZVw4o1MEAit3_thh',
  '1-BLrHghqv1vChnfCPfutT44XPHILZYTe',
  '1gymgXKePtqVcvhfKTH8x2WYmJOi73nP_',
] as const

export const getDriveDownloadUrl = (id: string) => `https://drive.google.com/uc?export=download&id=${id}`
export const getDrivePreviewUrl = (id: string) => `https://drive.google.com/file/d/${id}/preview`

export const books: Book[] = bookIds.map((id, index) => ({
  id,
  title: `藏书 ${String(index + 1).padStart(2, '0')}`,
  summary: 'Google Drive 公开文件 · EPUB / TXT 自动识别 · 阅读进度自动保存',
  sourceUrl: getDriveDownloadUrl(id),
  previewUrl: getDrivePreviewUrl(id),
}))

export const tracks: Track[] = trackIds.map((id, index) => ({
  id,
  title: `曲目 ${String(index + 1).padStart(2, '0')}`,
  artist: 'Xian-ru Playlist',
  sourceUrl: getDriveDownloadUrl(id),
}))
