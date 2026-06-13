/**
 * A4 纸张尺寸相关常量（96dpi）
 * 
 * 所有分页、预览、打印相关的尺寸参数统一从此处引用，
 * 确保预览面板与打印输出的分页行为完全一致。
 */

/** A4 页面宽度 (px @ 96dpi) */
export const A4_W = 794;

/** A4 页面高度 (px @ 96dpi) */
export const A4_H = 1123;

/** 页面上下 padding (px) */
export const A4_PADDING_Y = 48;

/** 页面左右 padding (px) */
export const A4_PADDING_X = 52;

/** 有效内容区高度 = A4_H - 上下padding */
export const A4_CONTENT_H = A4_H - A4_PADDING_Y * 2; // 1027px

/**
 * 分页安全缓冲区 (px)
 * 
 * 确保每页底部至少保留此高度的空白，防止内容紧贴底部边缘。
 * 底部总留白 = A4_PADDING_Y(48) + BOTTOM_SAFE_BUFFER(40) = 88px ≈ 23.3mm
 * 接近 Word A4 默认底部边距 (25.4mm / 96px)，视觉效果舒适。
 */
export const BOTTOM_SAFE_BUFFER = 40;

/** 
 * 分页可用高度 = 有效内容区高度 - 安全缓冲区
 * 分页算法以此高度作为每页内容的上限
 */
export const A4_SAFE_CONTENT_H = A4_CONTENT_H - BOTTOM_SAFE_BUFFER; // 987px
