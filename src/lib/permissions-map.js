export const PERMISSIONS_MAP = {
  // 相机
  'android.permission.CAMERA': { desc: '拍照和录像', level: 'danger' },

  // 联系人
  'android.permission.READ_CONTACTS': { desc: '读取联系人', level: 'danger' },
  'android.permission.WRITE_CONTACTS': { desc: '修改联系人', level: 'danger' },
  'android.permission.GET_ACCOUNTS': { desc: '访问账户列表', level: 'warning' },

  // 电话
  'android.permission.CALL_PHONE': { desc: '直接拨打电话', level: 'danger' },
  'android.permission.READ_PHONE_STATE': { desc: '读取电话状态', level: 'danger' },
  'android.permission.READ_CALL_LOG': { desc: '读取通话记录', level: 'danger' },
  'android.permission.WRITE_CALL_LOG': { desc: '修改通话记录', level: 'danger' },
  'android.permission.PROCESS_OUTGOING_CALLS': { desc: '监听外拨电话', level: 'danger' },
  'android.permission.ANSWER_PHONE_CALLS': { desc: '接听电话', level: 'danger' },

  // 短信
  'android.permission.SEND_SMS': { desc: '发送短信', level: 'danger' },
  'android.permission.RECEIVE_SMS': { desc: '接收短信', level: 'danger' },
  'android.permission.READ_SMS': { desc: '读取短信', level: 'danger' },
  'android.permission.WRITE_SMS': { desc: '编辑短信', level: 'danger' },
  'android.permission.RECEIVE_MMS': { desc: '接收彩信', level: 'danger' },
  'android.permission.RECEIVE_WAP_PUSH': { desc: '接收 WAP 推送', level: 'danger' },

  // 位置
  'android.permission.ACCESS_FINE_LOCATION': { desc: '精确位置 (GPS)', level: 'danger' },
  'android.permission.ACCESS_COARSE_LOCATION': { desc: '粗略位置 (网络)', level: 'warning' },
  'android.permission.ACCESS_BACKGROUND_LOCATION': { desc: '后台获取位置', level: 'danger' },
  'android.permission.ACCESS_LOCATION_EXTRA_COMMANDS': { desc: '额外位置信息', level: 'normal' },

  // 存储
  'android.permission.READ_EXTERNAL_STORAGE': { desc: '读取存储空间', level: 'warning' },
  'android.permission.WRITE_EXTERNAL_STORAGE': { desc: '修改存储空间', level: 'warning' },
  'android.permission.MANAGE_EXTERNAL_STORAGE': { desc: '管理所有文件', level: 'danger' },
  'android.permission.READ_MEDIA_IMAGES': { desc: '读取图片', level: 'warning' },
  'android.permission.READ_MEDIA_VIDEO': { desc: '读取视频', level: 'warning' },
  'android.permission.READ_MEDIA_AUDIO': { desc: '读取音频', level: 'warning' },

  // 网络
  'android.permission.INTERNET': { desc: '网络访问', level: 'normal' },
  'android.permission.ACCESS_NETWORK_STATE': { desc: '查看网络状态', level: 'normal' },
  'android.permission.ACCESS_WIFI_STATE': { desc: '查看 Wi-Fi 状态', level: 'normal' },
  'android.permission.CHANGE_WIFI_STATE': { desc: '修改 Wi-Fi 状态', level: 'warning' },
  'android.permission.CHANGE_NETWORK_STATE': { desc: '修改网络状态', level: 'warning' },
  'android.permission.BLUETOOTH': { desc: '蓝牙连接', level: 'warning' },
  'android.permission.BLUETOOTH_ADMIN': { desc: '蓝牙管理', level: 'warning' },
  'android.permission.BLUETOOTH_CONNECT': { desc: '蓝牙连接设备', level: 'warning' },
  'android.permission.BLUETOOTH_SCAN': { desc: '扫描蓝牙设备', level: 'warning' },
  'android.permission.NFC': { desc: 'NFC 近场通信', level: 'warning' },

  // 传感器
  'android.permission.BODY_SENSORS': { desc: '身体传感器', level: 'danger' },
  'android.permission.ACTIVITY_RECOGNITION': { desc: '活动识别', level: 'warning' },
  'android.permission.HIGH_SAMPLING_RATE_SENSORS': { desc: '高频传感器数据', level: 'warning' },

  // 录音
  'android.permission.RECORD_AUDIO': { desc: '录音', level: 'danger' },

  // 日历
  'android.permission.READ_CALENDAR': { desc: '读取日历', level: 'danger' },
  'android.permission.WRITE_CALENDAR': { desc: '修改日历', level: 'danger' },

  // 相册/媒体
  'android.permission.READ_MEDIA_VISUAL_USER_SELECTED': { desc: '读取部分媒体', level: 'warning' },

  // 系统
  'android.permission.VIBRATE': { desc: '振动', level: 'normal' },
  'android.permission.WAKE_LOCK': { desc: '防止休眠', level: 'normal' },
  'android.permission.RECEIVE_BOOT_COMPLETED': { desc: '开机自启动', level: 'warning' },
  'android.permission.SYSTEM_ALERT_WINDOW': { desc: '悬浮窗', level: 'warning' },
  'android.permission.REQUEST_INSTALL_PACKAGES': { desc: '安装应用', level: 'danger' },
  'android.permission.FOREGROUND_SERVICE': { desc: '前台服务', level: 'normal' },
  'android.permission.FOREGROUND_SERVICE_SPECIAL_USE': { desc: '特殊前台服务', level: 'warning' },
  'android.permission.POST_NOTIFICATIONS': { desc: '发送通知', level: 'normal' },
  'android.permission.SET_ALARM': { desc: '设置闹钟', level: 'normal' },
  'android.permission.INSTALL_SHORTCUT': { desc: '创建快捷方式', level: 'normal' },
  'android.permission.UNINSTALL_SHORTCUT': { desc: '删除快捷方式', level: 'normal' },
  'android.permission.EXPAND_STATUS_BAR': { desc: '展开状态栏', level: 'normal' },

  // 账号
  'android.permission.AUTHENTICATE_ACCOUNTS': { desc: '管理账户', level: 'warning' },
  'android.permission.USE_CREDENTIALS': { desc: '使用账户凭证', level: 'danger' },

  // 硬件
  'android.permission.FLASHLIGHT': { desc: '使用闪光灯', level: 'normal' },
  'android.permission.USE_FINGERPRINT': { desc: '指纹识别', level: 'warning' },
  'android.permission.USE_BIOMETRIC': { desc: '生物识别', level: 'warning' },

  // 开发/调试
  'android.permission.READ_LOGS': { desc: '读取日志', level: 'danger' },
  'android.permission.WRITE_SETTINGS': { desc: '修改系统设置', level: 'warning' },
  'android.permission.WRITE_SECURE_SETTINGS': { desc: '修改安全设置', level: 'danger' },
  'android.permission.DUMP': { desc: '转储系统信息', level: 'danger' },

  // 其他
  'android.permission.QUERY_ALL_PACKAGES': { desc: '查询已安装应用', level: 'warning' },
  'android.permission.REQUEST_DELETE_PACKAGES': { desc: '请求卸载应用', level: 'warning' },
  'android.permission.BIND_ACCESSIBILITY_SERVICE': { desc: '无障碍服务', level: 'warning' },
  'android.permission.PACKAGE_USAGE_STATS': { desc: '使用统计', level: 'danger' },
  'android.permission.READ_SYNC_SETTINGS': { desc: '读取同步设置', level: 'normal' },
  'android.permission.WRITE_SYNC_SETTINGS': { desc: '修改同步设置', level: 'normal' },
  'android.permission.BROADCAST_STICKY': { desc: '发送粘性广播', level: 'normal' },
  'android.permission.KILL_BACKGROUND_PROCESSES': { desc: '关闭后台进程', level: 'warning' },
  'android.permission.REORDER_TASKS': { desc: '调整任务顺序', level: 'normal' },
  'android.permission.READ_PROFILE': { desc: '读取个人资料', level: 'danger' },
  'android.permission.WRITE_PROFILE': { desc: '修改个人资料', level: 'danger' }
}

const LEVEL_LABELS = {
  danger: '敏感',
  warning: '中等',
  normal: '常规'
}

const LEVEL_COLORS = {
  danger: '#ff4d4f',
  warning: '#faad14',
  normal: '#52c41a'
}

export function getPermissionInfo (permName) {
  const entry = PERMISSIONS_MAP[permName]
  if (entry) {
    return { desc: entry.desc, level: entry.level, levelLabel: LEVEL_LABELS[entry.level], levelColor: LEVEL_COLORS[entry.level] }
  }
  return { desc: '未知权限', level: 'normal', levelLabel: '未知', levelColor: '#999' }
}
