//
/**
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

#import "RNFBCrashlyticsNativeHelper.h"
#import <Firebase/Firebase.h>

@implementation RNFBCrashlyticsNativeHelper

+ (void)recordNativeError:(NSError *)error {
  [[FIRCrashlytics crashlytics] recordError:error];
}

+ (void)log:(nonnull NSString *)msg {
  [[FIRCrashlytics crashlytics] log:msg];
}

+ (void)setCustomValue:(nullable id)value forKey:(nonnull NSString *)key {
  [[FIRCrashlytics crashlytics] setCustomValue:value forKey:key];
}

@end
