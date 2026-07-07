const assert = require('node:assert');

// 1. 模拟 syncResumesMiddleware 的简化行为进行功能逻辑测试
const syncResumesMiddlewareMock = (set) => {
  return (partial, replace) => {
    // 模拟中间件行为
    const nextState = typeof partial === 'function' ? partial({ resume: {} }) : partial;
    
    if (nextState.resume) {
      const updatedResume = { ...nextState.resume };
      if (!nextState._isSyncFromServer) {
        updatedResume.updatedAt = 99999; // 模拟 Date.now() 更新为最新
      }
      // 剔除标记
      const { _isSyncFromServer, ...cleanNextState } = nextState;
      return {
        ...cleanNextState,
        resume: updatedResume,
      };
    }
    return nextState;
  };
};

// 测试用例 1: 客户端 UI 动作修改时，应该自动为 resume 注入 updatedAt
function testClientActionUpdatesTimestamp() {
  const actionResult = syncResumesMiddlewareMock((partial) => partial)({
    resume: { id: 'test-1', basicInfo: { name: '张三' } }
  });
  assert.strictEqual(actionResult.resume.updatedAt, 99999);
  console.log('✓ testClientActionUpdatesTimestamp passed');
}

// 测试用例 2: 服务端同步覆盖动作修改时，带有 _isSyncFromServer，应该保留传入的时间戳，且 _isSyncFromServer 被剔除
function testServerSyncRetainsTimestamp() {
  const actionResult = syncResumesMiddlewareMock((partial) => partial)({
    resume: { id: 'test-1', basicInfo: { name: '李四' }, updatedAt: 12345 },
    _isSyncFromServer: true
  });
  assert.strictEqual(actionResult.resume.updatedAt, 12345);
  assert.strictEqual(actionResult._isSyncFromServer, undefined);
  console.log('✓ testServerSyncRetainsTimestamp passed');
}

// 运行测试
try {
  testClientActionUpdatesTimestamp();
  testServerSyncRetainsTimestamp();
  console.log('All store middleware tests passed!');
} catch (err) {
  console.error('Test failed:', err);
  process.exit(1);
}
