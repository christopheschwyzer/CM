<?php

class CM_App_InstallationTest extends CMTest_TestCase {

    public function testGetPackages() {
        $package1 = $this->getMockBuilder('\Composer\Package\CompletePackage')
            ->setMethods(array('getName', 'getRequires', 'getExtra'))->disableOriginalConstructor()->getMock();
        $package1->expects($this->any())->method('getName')->will($this->returnValue('cargomedia/cm'));
        $package1->expects($this->any())->method('getRequires')->will($this->returnValue(array()));
        $package1->expects($this->any())->method('getExtra')->will($this->returnValue(array('cm-modules' => array())));
        /** @var \Composer\Package\CompletePackage $package1 */

        $package2 = $this->getMockBuilder('\Composer\Package\CompletePackage')
            ->setMethods(array('getName', 'getRequires', 'getExtra'))->disableOriginalConstructor()->getMock();
        $package2->expects($this->any())->method('getName')->will($this->returnValue('foo'));
        $package2->expects($this->any())->method('getRequires')->will($this->returnValue(array('owl' => '*')));
        $package2->expects($this->any())->method('getExtra')->will($this->returnValue(array('cm-modules' => array())));
        /** @var \Composer\Package\CompletePackage $package2 */

        $package3 = $this->getMockBuilder('\Composer\Package\CompletePackage')
            ->setMethods(array('getName', 'getRequires', 'getExtra'))->disableOriginalConstructor()->getMock();
        $package3->expects($this->any())->method('getName')->will($this->returnValue('bar'));
        $package3->expects($this->any())->method('getRequires')->will($this->returnValue(array()));
        $package3->expects($this->any())->method('getExtra')->will($this->returnValue(array('cm-modules' => array())));
        /** @var \Composer\Package\CompletePackage $package3 */

        $package4 = $this->getMockBuilder('\Composer\Package\CompletePackage')
            ->setMethods(array('getName', 'getRequires', 'getExtra'))->disableOriginalConstructor()->getMock();
        $package4->expects($this->any())->method('getName')->will($this->returnValue('owl'));
        $package4->expects($this->any())->method('getRequires')->will($this->returnValue(array('cargomedia/cm' => '*')));
        $package4->expects($this->any())->method('getExtra')->will($this->returnValue(array('cm-modules' => array())));
        /** @var \Composer\Package\CompletePackage $package4 */

        $composerPackages = array($package1, $package2, $package3, $package4);
        $installation = $this->getMockBuilder('CM_App_Installation')->setMethods(array('_getComposerPackages', '_getComposerVendorDir'))->getMock();
        $installation->expects($this->any())->method('_getComposerPackages')->will($this->returnValue($composerPackages));
        $installation->expects($this->any())->method('_getComposerVendorDir')->will($this->returnValue('vendor/'));
        /** @var CM_App_Installation $installation */

        $packages = $installation->getPackages();
        $this->assertCount(3, $packages);
        $this->assertContainsOnlyInstancesOf('CM_App_Package', $packages);
        $this->assertSame($package1->getName(), $packages[0]->getName());
        $this->assertSame($package4->getName(), $packages[1]->getName());
        $this->assertSame($package2->getName(), $packages[2]->getName());
    }

    /**
     * @expectedException CM_Exception_Invalid
     * @expectedExceptionMessage Missing `cm-modules` in `foo` package composer extra
     */
    public function testGetPackageFromComposerPackageMissingExtra() {
        $composerPackage = $this->getMockBuilder('\Composer\Package\CompletePackage')
            ->setMethods(array('getName', 'getPrettyName', 'getExtra'))->disableOriginalConstructor()->getMock();
        $composerPackage->expects($this->any())->method('getName')->will($this->returnValue('foo'));
        $composerPackage->expects($this->any())->method('getPrettyName')->will($this->returnValue('foo'));
        $composerPackage->expects($this->any())->method('getExtra')->will($this->returnValue(array()));
        /** @var \Composer\Package\CompletePackage $composerPackage */

        $installation = $this->getMockBuilder('CM_App_Installation')->setMethods(array('_getComposerPackages', '_getComposerVendorDir'))->getMock();
        $installation->expects($this->any())->method('_getComposerVendorDir')->will($this->returnValue('vendor/'));

        $method = CMTest_TH::getProtectedMethod('CM_App_Installation', '_getPackageFromComposerPackage');
        $package = $method->invoke($installation, $composerPackage);
    }

    public function testGetModulePaths() {
        $package1 = new CM_App_Package('foo', 'foo/');
        $package1->addModule('foo-foo', 'foo/');
        $package1->addModule('foo-bar', 'bar/');

        $package2 = new CM_App_Package('bar', 'bar/');
        $package2->addModule('bar-foo', 'foo/');
        $package2->addModule('bar-bar', 'bar/');

        $installation = $this->getMockBuilder('CM_App_Installation')->setMethods(array('getPackages'))->getMock();
        $installation->expects($this->any())->method('getPackages')->will($this->returnValue(array($package1, $package2)));
        /** @var CM_App_Installation $installation */

        $this->assertSame(array(
            'foo-foo' => 'foo/foo/',
            'foo-bar' => 'foo/bar/',
            'bar-foo' => 'bar/foo/',
            'bar-bar' => 'bar/bar/',
        ), $installation->getModulePaths());
    }
}
