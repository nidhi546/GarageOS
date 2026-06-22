#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import "ExpoModulesCore-Swift.h"

// Forward declaration needed so statics below can use the type before @interface.
@class AppDelegateFactoryDelegate;

// Static storage shared between the app-delegate and scene-delegate AppDelegate instances.
// iOS creates a separate AppDelegate instance as the UIScene delegate; statics bridge them.
//
// sFactoryDelegate: strongly retained here because RCTReactNativeFactory.delegate is weak.
//   A local variable would be released when didFinishLaunchingWithOptions: returns, leaving
//   the factory with a nil delegate by the time scene:willConnectToSession: fires.
// sSharedReactNativeFactory: the shared RCT runtime, created once in didFinishLaunching.
// sMainWindow: retained so ARC doesn't release the scene window after the method returns.
static AppDelegateFactoryDelegate *sFactoryDelegate = nil;
static RCTReactNativeFactory *sSharedReactNativeFactory = nil;
static UIWindow *sMainWindow = nil;

// ObjC delegate for RCTReactNativeFactory. Subclasses the ObjC base class
// (ExpoReactNativeFactoryDelegate is objc_subclassing_restricted and cannot be subclassed
// from ObjC). Provides bundleURL / sourceURLForBridge and forwards customizeRootView:
// to Expo module subscribers (splash screen, etc.).
@interface AppDelegateFactoryDelegate : RCTDefaultReactNativeFactoryDelegate
@end

@implementation AppDelegateFactoryDelegate

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return self.bundleURL;
}

- (void)customizeRootView:(UIView *)rootView
{
  for (id<EXAppDelegateSubscriberProtocol> subscriber in EXExpoAppDelegateSubscriberRepository.subscribers) {
    if ([subscriber respondsToSelector:@selector(customizeRootView:)]) {
      [subscriber customizeRootView:rootView];
    }
  }
}

@end

@implementation AppDelegate

// UIApplicationDelegate.window — RCTDeviceInfo and other RN modules call appDelegate.window.
// EXAppDelegateWrapper forwards unknown selectors to _expoAppDelegate (EXExpoAppDelegate),
// which has no window property, causing a crash. Intercept here to return sMainWindow.
- (UIWindow *)window
{
  return sMainWindow;
}

- (void)setWindow:(UIWindow *)window
{
  sMainWindow = window;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"main";
  self.initialProps = @{};

  sFactoryDelegate = [AppDelegateFactoryDelegate new];
  sFactoryDelegate.dependencyProvider = [RCTAppDependencyProvider new];
  sSharedReactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:sFactoryDelegate];

  // Wire factory into _expoAppDelegate so any Expo code path that accesses
  // _expoAppDelegate.factory (e.g. recreateRootView) gets the correct instance.
  [(NSObject *)[(NSObject *)self valueForKey:@"_expoAppDelegate"]
      setValue:sSharedReactNativeFactory
      forKey:@"factory"];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// iOS 26+ UIScene lifecycle. Return a configuration so iOS knows to use AppDelegate
// as the scene delegate (UISceneDelegateClassName = "AppDelegate" in Info.plist).
- (UISceneConfiguration *)application:(UIApplication *)application
    configurationForConnectingSceneSession:(UISceneSession *)connectingSceneSession
                                   options:(UISceneConnectionOptions *)options
{
  return [[UISceneConfiguration alloc] initWithName:@"Default Configuration"
                                        sessionRole:connectingSceneSession.role];
}

// UISceneDelegate — called on a second AppDelegate instance iOS creates for the scene.
// sSharedReactNativeFactory bridges the two instances; sMainWindow keeps the window alive.
- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions
{
  UIWindowScene *windowScene = (UIWindowScene *)scene;
  sMainWindow = [[UIWindow alloc] initWithWindowScene:windowScene];
  [sSharedReactNativeFactory startReactNativeWithModuleName:@"main" inWindow:sMainWindow];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || result;
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  return [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  return [super application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  return [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

@end
