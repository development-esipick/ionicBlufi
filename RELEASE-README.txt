ANDROID
	- Update version in <widget> in config.xml
	- Do release  build
		ionic cordova build --release android
	- Sign jar (passphrase simplesensor)
		jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore android-release-key.keystore ./platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk alias_name
	- remove previously signed apk
		rm -f ./platforms/android/app/build/outputs/apk/release/simpleSensor-signed.apk
	- zip jar
		/Users/joeackert/Library/Android/sdk/build-tools/27.0.3/zipalign -v 4 ./platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk ./platforms/android/app/build/outputs/apk/release/simpleSensor-signed.apk
	- upload to google play store

