# 計算機視覺集成指南

## 概述
這個考拉寵物系統設計用於與計算機視覺和眼動追蹤系統集成，專門為ADHD學生提供注意力管理支持。

## 集成方式

### 1. 全局事件處理器
系統暴露了一個全局函數 `window.handleComputerVisionEvent` 來接收計算機視覺事件：

```javascript
// 當檢測到學生分心時
window.handleComputerVisionEvent({
  type: 'distracted',
  timestamp: Date.now(),
  confidence: 0.85
});

// 當檢測到學生重新專注時
window.handleComputerVisionEvent({
  type: 'refocused',
  timestamp: Date.now(),
  confidence: 0.92
});
```

### 2. 事件類型
- `distracted`: 學生分心時觸發
- `refocused`: 學生重新專注時觸發

### 3. 考拉行為邏輯
- **專注狀態**: 考拉保持平靜的idle動畫（koala_1.json）
- **分心狀態**: 考拉會隨機選擇動畫來吸引注意力
  - 輕微分心: 使用 koala_2, koala_3, koala_4
  - 嚴重分心: 使用 koala_5, koala_6, koala_7
  - 重新專注: 使用 koala_8, koala_9, koala_10 慶祝

### 4. 音頻提示
- 分心時播放溫和的提示音
- 重新專注時播放慶祝音效
- 支持靜音功能

### 5. 視覺反饋
- 分心時顯示鼓勵性文字氣泡
- 重新專注時顯示讚美性文字氣泡
- 動畫持續時間根據分心程度調整

## 使用示例

```javascript
// 在您的計算機視覺系統中
function onAttentionChange(isFocused, confidence) {
  if (window.handleComputerVisionEvent) {
    window.handleComputerVisionEvent({
      type: isFocused ? 'refocused' : 'distracted',
      timestamp: Date.now(),
      confidence: confidence
    });
  }
}

// 監聽眼動追蹤數據
eyeTracker.onGazeChange((gazeData) => {
  const isLookingAtScreen = checkIfLookingAtScreen(gazeData);
  const confidence = calculateConfidence(gazeData);
  
  onAttentionChange(isLookingAtScreen, confidence);
});
```

## 注意事項
- 考拉只在檢測到分心時才會改變情緒
- 專注時考拉保持平靜，不會打擾學生
- 系統支持10個不同的考拉動畫
- 所有動畫都經過優化，適合ADHD學生的注意力需求
